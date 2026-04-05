"""
Extract and decrypt Chrome cookies for fundflowos.com
Outputs JSON that can be consumed by Puppeteer.
"""
import os
import sys
import json
import shutil
import sqlite3
import base64
import win32crypt
from Crypto.Cipher import AES

CHROME_USER_DATA = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data')
COOKIE_DB = os.path.join(CHROME_USER_DATA, 'Default', 'Network', 'Cookies')
LOCAL_STATE = os.path.join(CHROME_USER_DATA, 'Local State')

def get_encryption_key():
    """Get the AES key Chrome uses to encrypt cookies (v10+ format)."""
    with open(LOCAL_STATE, 'r', encoding='utf-8') as f:
        local_state = json.load(f)

    encrypted_key = base64.b64decode(local_state['os_crypt']['encrypted_key'])
    # Remove 'DPAPI' prefix (first 5 bytes)
    encrypted_key = encrypted_key[5:]
    # Decrypt with Windows DPAPI
    key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    return key

def decrypt_cookie_value(encrypted_value, key):
    """Decrypt a Chrome cookie value."""
    if not encrypted_value:
        return ''

    # v10/v20 format: starts with 'v10' or 'v20' prefix (3 bytes)
    version = encrypted_value[:3]

    if version == b'v10' or version == b'v20':
        # AES-256-GCM
        nonce = encrypted_value[3:3+12]
        ciphertext = encrypted_value[3+12:-16]
        tag = encrypted_value[-16:]

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        try:
            decrypted = cipher.decrypt_and_verify(ciphertext, tag)
            return decrypted.decode('utf-8', errors='replace')
        except Exception as e:
            # Try without tag verification
            cipher2 = AES.new(key, AES.MODE_GCM, nonce=nonce)
            decrypted = cipher2.decrypt(ciphertext)
            return decrypted.decode('utf-8', errors='replace')
    else:
        # Old DPAPI format
        try:
            return win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1].decode('utf-8')
        except:
            return ''

def main():
    # Copy cookie DB to avoid locking issues with running Chrome
    tmp_db = os.path.join(os.environ['TEMP'], 'chrome_cookies_tmp.db')

    # Try multiple possible cookie locations
    cookie_paths = [
        os.path.join(CHROME_USER_DATA, 'Default', 'Network', 'Cookies'),
        os.path.join(CHROME_USER_DATA, 'Default', 'Cookies'),
        os.path.join(CHROME_USER_DATA, 'Profile 1', 'Network', 'Cookies'),
        os.path.join(CHROME_USER_DATA, 'Profile 1', 'Cookies'),
    ]

    source_db = None
    for path in cookie_paths:
        if os.path.exists(path):
            source_db = path
            print(f"Found cookies at: {path}", file=sys.stderr)
            break

    if not source_db:
        print("Could not find Chrome cookies database!", file=sys.stderr)
        print(f"Searched: {cookie_paths}", file=sys.stderr)
        sys.exit(1)

    # Try copying - if locked, try robocopy or direct read-only access
    try:
        shutil.copy2(source_db, tmp_db)
    except PermissionError:
        print("Direct copy failed, trying robocopy...", file=sys.stderr)
        src_dir = os.path.dirname(source_db)
        src_file = os.path.basename(source_db)
        dst_dir = os.path.dirname(tmp_db)
        os.system(f'robocopy "{src_dir}" "{dst_dir}" "{src_file}" /B /NFL /NDL /NJH /NJS > NUL 2>&1')
        # Rename the robocopy output
        robocopy_output = os.path.join(dst_dir, src_file)
        if os.path.exists(robocopy_output) and robocopy_output != tmp_db:
            if os.path.exists(tmp_db):
                os.remove(tmp_db)
            os.rename(robocopy_output, tmp_db)

        if not os.path.exists(tmp_db):
            print("Robocopy failed too, trying read-only SQLite URI...", file=sys.stderr)
            tmp_db = f"file:{source_db}?mode=ro"

    # Get encryption key
    key = get_encryption_key()
    print(f"Got encryption key", file=sys.stderr)

    # Query cookies
    if tmp_db.startswith('file:'):
        conn = sqlite3.connect(tmp_db, uri=True)
    else:
        conn = sqlite3.connect(tmp_db)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT host_key, name, encrypted_value, path, is_secure, is_httponly, expires_utc
        FROM cookies
        WHERE host_key LIKE '%fundflowos%'
    """)

    rows = cursor.fetchall()
    print(f"Found {len(rows)} cookies for fundflowos.com", file=sys.stderr)

    cookies = []
    for row in rows:
        host, name, enc_value, path, secure, httponly, expires = row
        value = decrypt_cookie_value(enc_value, key)

        if value:
            cookie = {
                'name': name,
                'value': value,
                'domain': host,
                'path': path or '/',
                'secure': bool(secure),
                'httpOnly': bool(httponly),
            }
            cookies.append(cookie)
            print(f"  Decrypted: {name} = {value[:20]}...", file=sys.stderr)

    conn.close()
    if not tmp_db.startswith('file:') and os.path.exists(tmp_db):
        os.remove(tmp_db)

    # Output as JSON to stdout
    print(json.dumps(cookies, indent=2))

if __name__ == '__main__':
    main()

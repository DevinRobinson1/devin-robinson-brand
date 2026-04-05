param(
    [string]$OutputPath,
    [string]$WindowTitle = "Fund Flow"
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WinAPI {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
"@

# Find Chrome window with the Fund Flow title
$targetHwnd = [IntPtr]::Zero
$windows = New-Object System.Collections.ArrayList

[WinAPI]::EnumWindows({
    param($hwnd, $lParam)
    if ([WinAPI]::IsWindowVisible($hwnd)) {
        $sb = New-Object System.Text.StringBuilder 256
        [WinAPI]::GetWindowText($hwnd, $sb, 256) | Out-Null
        $title = $sb.ToString()
        if ($title -like "*$WindowTitle*" -and $title -like "*Chrome*") {
            $script:targetHwnd = $hwnd
            Write-Host "Found window: $title"
        }
    }
    return $true
}, [IntPtr]::Zero) | Out-Null

if ($targetHwnd -eq [IntPtr]::Zero) {
    # Try broader search
    [WinAPI]::EnumWindows({
        param($hwnd, $lParam)
        if ([WinAPI]::IsWindowVisible($hwnd)) {
            $sb = New-Object System.Text.StringBuilder 256
            [WinAPI]::GetWindowText($hwnd, $sb, 256) | Out-Null
            $title = $sb.ToString()
            if ($title -like "*$WindowTitle*") {
                $script:targetHwnd = $hwnd
                Write-Host "Found window: $title"
            }
        }
        return $true
    }, [IntPtr]::Zero) | Out-Null
}

if ($targetHwnd -eq [IntPtr]::Zero) {
    Write-Error "Could not find window with title containing '$WindowTitle'"
    exit 1
}

# Bring window to foreground
[WinAPI]::SetForegroundWindow($targetHwnd) | Out-Null
Start-Sleep -Milliseconds 500

# Get window rect
$rect = New-Object WinAPI+RECT
[WinAPI]::GetWindowRect($targetHwnd, [ref]$rect) | Out-Null

$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top

Write-Host "Window size: ${width}x${height} at ($($rect.Left), $($rect.Top))"

# Capture the window area
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))
$graphics.Dispose()

# Save as JPEG with high quality
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92)
$bitmap.Save($OutputPath, $jpegEncoder, $encoderParams)
$bitmap.Dispose()

$fileSize = (Get-Item $OutputPath).Length
Write-Host "Saved: $OutputPath ($fileSize bytes)"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;

public class WinCapture {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }

    // PW_RENDERFULLCONTENT = 2 (captures the full window including offscreen content)
    public static Bitmap CaptureWindow(IntPtr hWnd) {
        RECT rect;
        GetWindowRect(hWnd, out rect);
        int width = rect.Right - rect.Left;
        int height = rect.Bottom - rect.Top;

        Bitmap bmp = new Bitmap(width, height, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
        Graphics gfx = Graphics.FromImage(bmp);
        IntPtr hdc = gfx.GetHdc();

        // Use PW_RENDERFULLCONTENT (2) for better capture
        PrintWindow(hWnd, hdc, 2);

        gfx.ReleaseHdc(hdc);
        gfx.Dispose();
        return bmp;
    }
}
"@

$TEMP_DIR = "C:\Users\drrob\AppData\Local\Temp\ff_screenshots"
$FINAL_DIR = "C:\Users\drrob\OneDrive\Desktop\Claude\Skills\Website creator\Fund Flow\screenshots"

if (-not (Test-Path $TEMP_DIR)) { New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null }

function Find-ChromeWindow {
    $script:chromeHwnd = [IntPtr]::Zero
    [WinCapture]::EnumWindows({
        param($hwnd, $lParam)
        if ([WinCapture]::IsWindowVisible($hwnd)) {
            $sb = New-Object System.Text.StringBuilder 256
            [WinCapture]::GetWindowText($hwnd, $sb, 256) | Out-Null
            $title = $sb.ToString()
            if ($title -like "*Fund Flow*" -and $title -like "*Chrome*") {
                $script:chromeHwnd = $hwnd
            }
        }
        return $true
    }, [IntPtr]::Zero) | Out-Null
    return $script:chromeHwnd
}

function Capture-Window {
    param([string]$Name)

    $hwnd = Find-ChromeWindow
    if ($hwnd -eq [IntPtr]::Zero) {
        Write-Host "  ERROR: Chrome window not found"
        return
    }

    # Bring to foreground first
    [WinCapture]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Milliseconds 500

    # Capture using PrintWindow API (captures the window buffer directly)
    $bitmap = [WinCapture]::CaptureWindow($hwnd)
    Write-Host "  Captured window: $($bitmap.Width)x$($bitmap.Height)"

    $tempPath = Join-Path $TEMP_DIR "$Name.jpg"
    $jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92)
    $bitmap.Save($tempPath, $jpegEncoder, $encoderParams)
    $bitmap.Dispose()

    # Copy to final destination
    $finalPath = Join-Path $FINAL_DIR "$Name.jpg"
    Copy-Item $tempPath $finalPath -Force -ErrorAction SilentlyContinue

    $fileSize = (Get-Item $tempPath).Length
    Write-Host "  Saved: $Name.jpg ($fileSize bytes)"
}

$pageName = $args[0]
if ($pageName) {
    Capture-Window -Name $pageName
} else {
    Write-Host "Usage: capture-all.ps1 <page-name>"
}

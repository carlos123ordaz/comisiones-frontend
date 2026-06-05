Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies @("System.Drawing") -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;

public static class IconGen
{
    public static Bitmap Draw(int size)
    {
        var bmp = new Bitmap(size, size);
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode    = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
            g.Clear(Color.Transparent);

            // ---- fondo redondeado con gradiente ----
            int pad    = (int)(size * 0.06);
            int radius = (int)(size * 0.22);
            var rect   = new Rectangle(pad, pad, size - pad * 2, size - pad * 2);

            var bgPath = new GraphicsPath();
            bgPath.AddArc(rect.X,                    rect.Y,                    radius*2, radius*2, 180, 90);
            bgPath.AddArc(rect.Right - radius*2,     rect.Y,                    radius*2, radius*2, 270, 90);
            bgPath.AddArc(rect.Right - radius*2,     rect.Bottom - radius*2,    radius*2, radius*2,   0, 90);
            bgPath.AddArc(rect.X,                    rect.Bottom - radius*2,    radius*2, radius*2,  90, 90);
            bgPath.CloseFigure();

            using (var grad = new LinearGradientBrush(
                new Point(0, 0), new Point(size, size),
                Color.FromArgb(255, 30, 58, 138),
                Color.FromArgb(255, 5, 150, 105)))
            {
                g.FillPath(grad, bgPath);
            }

            // ---- 3 barras de gráfico ascendentes ----
            int baseY  = (int)(size * 0.78);
            int barW   = (int)(size * 0.13);
            int gap    = (int)(size * 0.06);
            int totalW = barW * 3 + gap * 2;
            int startX = (size - totalW) / 2;
            int cr     = (int)(barW * 0.4);

            int[] heights = { (int)(size*0.28), (int)(size*0.42), (int)(size*0.58) };
            Color[] barColors = {
                Color.FromArgb(200, 255, 255, 255),
                Color.FromArgb(215, 255, 255, 255),
                Color.FromArgb(255, 167, 243, 208)
            };

            for (int i = 0; i < 3; i++)
            {
                int bx = startX + i * (barW + gap);
                int bh = heights[i];
                int by = baseY - bh;

                var bp = new GraphicsPath();
                bp.AddArc(bx,            by,          cr*2, cr*2, 180, 90);
                bp.AddArc(bx+barW-cr*2,  by,          cr*2, cr*2, 270, 90);
                bp.AddLine(bx + barW, baseY, bx, baseY);
                bp.CloseFigure();

                using (var br = new SolidBrush(barColors[i]))
                    g.FillPath(br, bp);
            }

            // ---- símbolo $ sobre la barra más alta ----
            float fontSize = Math.Max(4f, size * 0.22f);
            using (var font = new Font("Arial", fontSize, FontStyle.Bold))
            using (var dollarBr = new SolidBrush(Color.White))
            {
                string s   = "$";
                var    sf  = g.MeasureString(s, font);
                int    bx3 = startX + 2 * (barW + gap);
                float  sx  = bx3 + (barW - sf.Width) / 2f;
                float  sy  = baseY - heights[2] - sf.Height - size * 0.02f;
                g.DrawString(s, font, dollarBr, sx, sy);
            }

            // ---- línea de tendencia con flecha ----
            using (var pen = new Pen(Color.FromArgb(210, 255, 255, 255), Math.Max(1.5f, size * 0.025f))
            {
                StartCap = LineCap.Round, EndCap = LineCap.Round
            })
            {
                int lx1 = startX - gap;
                int ly1 = baseY - (int)(size * 0.14);
                int lx2 = startX + totalW + gap;
                int ly2 = baseY - (int)(size * 0.62);
                g.DrawLine(pen, lx1, ly1, lx2, ly2);

                // flecha
                int arr = (int)(size * 0.07);
                var pts = new PointF[]
                {
                    new PointF(lx2,       ly2),
                    new PointF(lx2 - arr, ly2 - arr * 0.4f),
                    new PointF(lx2 - arr, ly2 + arr * 0.4f)
                };
                using (var arrBr = new SolidBrush(Color.FromArgb(210, 255, 255, 255)))
                    g.FillPolygon(arrBr, pts);
            }
        }
        return bmp;
    }

    public static void SaveIco(string path, List<Bitmap> bmps)
    {
        using (var fs = new FileStream(path, FileMode.Create))
        using (var bw = new BinaryWriter(fs))
        {
            int count = bmps.Count;
            bw.Write((short)0);
            bw.Write((short)1);
            bw.Write((short)count);

            var pngs = new List<byte[]>();
            foreach (var b in bmps)
            {
                using (var ms = new MemoryStream())
                {
                    b.Save(ms, ImageFormat.Png);
                    pngs.Add(ms.ToArray());
                }
            }

            int offset = 6 + count * 16;
            for (int i = 0; i < count; i++)
            {
                int s = bmps[i].Width;
                bw.Write((byte)(s >= 256 ? 0 : s));
                bw.Write((byte)(s >= 256 ? 0 : s));
                bw.Write((byte)0);
                bw.Write((byte)0);
                bw.Write((short)1);
                bw.Write((short)32);
                bw.Write((int)pngs[i].Length);
                bw.Write((int)offset);
                offset += pngs[i].Length;
            }
            foreach (var data in pngs) bw.Write(data);
        }
    }
}
"@

$baseDir = "D:/BOOT/user/CORDAZ/Documents/proyectos/02-03-2026/proyectos-comision/comisiones-desktop/src-tauri/icons"

$sizes = @(
    @{ file="32x32.png";             size=32  },
    @{ file="128x128.png";           size=128 },
    @{ file="128x128@2x.png";        size=256 },
    @{ file="icon.png";              size=512 },
    @{ file="Square30x30Logo.png";   size=30  },
    @{ file="Square44x44Logo.png";   size=44  },
    @{ file="Square71x71Logo.png";   size=71  },
    @{ file="Square89x89Logo.png";   size=89  },
    @{ file="Square107x107Logo.png"; size=107 },
    @{ file="Square142x142Logo.png"; size=142 },
    @{ file="Square150x150Logo.png"; size=150 },
    @{ file="Square284x284Logo.png"; size=284 },
    @{ file="Square310x310Logo.png"; size=310 },
    @{ file="StoreLogo.png";         size=50  }
)

foreach ($entry in $sizes) {
    $bmp = [IconGen]::Draw($entry.size)
    $out = Join-Path $baseDir $entry.file
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generado: $($entry.file) ($($entry.size)px)"
}

# --- icon.ico multi-tamaño ---
$icoSizes = @(16, 24, 32, 48, 256)
$icoBmps  = [System.Collections.Generic.List[System.Drawing.Bitmap]]::new()
foreach ($s in $icoSizes) { $icoBmps.Add([IconGen]::Draw($s)) }

[IconGen]::SaveIco((Join-Path $baseDir "icon.ico"), $icoBmps)
foreach ($b in $icoBmps) { $b.Dispose() }

Write-Host "Generado: icon.ico (16,24,32,48,256px)"
Write-Host "Listo."

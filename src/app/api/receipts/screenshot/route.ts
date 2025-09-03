import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright-chromium'

export async function POST(request: NextRequest) {
  try {
    const { receiptHtml, format = 'png', filename } = await request.json()

    if (!receiptHtml) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing receipt HTML',
        },
        { status: 400 }
      )
    }

    console.log('Starting Playwright screenshot...')
    
    // Launch browser with Playwright
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--single-process'
      ]
    })
    
    console.log('Browser launched successfully with Playwright')

    const page = await browser.newPage()

    // Set viewport for high quality
    await page.setViewportSize({
      width: 800,
      height: 1200,
    })

    // Create complete HTML with styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Receipt Screenshot</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background: #ffffff;
              padding: 20px;
              line-height: 1.5;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
            }
            
            /* Receipt Template Base */
            #receipt-template {
              background: white;
              padding: 24px 32px;
              max-width: 768px;
              margin: 0 auto;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              font-family: Arial, sans-serif;
              min-height: fit-content;
              width: 100%;
              box-sizing: border-box;
            }
            
            /* Layout utilities */
            .flex { display: flex; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            
            /* Spacing utilities */
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .p-6 { padding: 1.5rem; }
            .p-4 { padding: 1rem; }
            .px-8 { padding-left: 2rem; padding-right: 2rem; }
            .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mt-8 { margin-top: 2rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            
            /* Border radius */
            .rounded-3xl { border-radius: 1.5rem; }
            .rounded-xl { border-radius: 0.75rem; }
            
            /* Typography */
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .italic { font-style: italic; }
            .leading-relaxed { line-height: 1.625; }
            
            /* Colors */
            .text-black { color: #000000; }
            .text-white { color: #ffffff; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .bg-white { background-color: #ffffff; }
            .bg-gray-50 { background-color: #f9fafb; }
            
            /* Border */
            .border { border-width: 1px; }
            .border-gray-200 { border-color: #e5e7eb; }
            
            /* Shadow */
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            
            /* Print styles */
            .print\:shadow-none { box-shadow: none; }
            
            /* Custom inline styles override */
            [style*="font-size"] {
              line-height: 1.4 !important;
            }
            
            /* Ensure proper text rendering */
            .receipt-container * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Responsive adjustments for screenshot */
            @media screen {
              .receipt-container {
                max-width: 100%;
                padding: 20px;
              }
              #receipt-template {
                padding: 32px;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptHtml}
          </div>
        </body>
      </html>
    `

    // Set content and wait for load
    await page.setContent(fullHtml, { waitUntil: 'networkidle' })

    // Wait a bit more for rendering
    await new Promise(resolve => setTimeout(resolve, 1000))

    let result

    if (format === 'pdf') {
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      })

      result = {
        data: Buffer.from(pdfBuffer).toString('base64'),
        contentType: 'application/pdf',
      }
    } else {
      // Generate PNG screenshot
      const containerHeight = await page.evaluate(() => {
        const container = document.querySelector('.receipt-container')
        return container ? container.scrollHeight + 40 : 1000
      })
      
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: 800,
          height: containerHeight,
        },
      })

      result = {
        data: Buffer.from(screenshotBuffer).toString('base64'),
        contentType: 'image/png',
      }
    }

    await browser.close()

    console.log('Screenshot completed successfully')

    return NextResponse.json({
      success: true,
      data: result.data,
      contentType: result.contentType,
      filename: filename || `receipt-${Date.now()}.${format}`,
    })
  } catch (error) {
    console.error('Screenshot error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

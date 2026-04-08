# Devin Robinson Brand — Project Guidelines

## Google Tag Manager
Every new HTML page must include the GTM snippet (container ID: `GTM-TTNRQXBH`).

1. Add this as high in the `<head>` as possible (after `<meta charset>` and `<meta viewport>`):
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TTNRQXBH');</script>
<!-- End Google Tag Manager -->
```

2. Add this immediately after the opening `<body>` tag:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TTNRQXBH"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## Brand Colors
```
--ink: #0a0a0a
--charcoal: #1a1a1a
--accent: #c45a3c
--accent-dark: #a8432a
--cream: #f8f7f5
```

## Fonts
- Inter (weights: 300-900) — body
- Playfair Display (italic, 600/700) — accent headings

## Key Links
- Calendly (CAIO): https://calendly.com/devinrobinson1/fractional-caio
- Skool Community: https://www.skool.com/rei-legacy-builders-6440
- Fund Flow OS: https://fundflowos.com

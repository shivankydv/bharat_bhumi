/**
 * Shared Tailwind CSS Configuration for Bharat LandStack
 * Extracted from original Stitch export to ensure exact design token consistency across pages.
 */
tailwind = {
  config: {
    darkMode: "class",
    theme: {
      extend: {
        "colors": {
          "on-error-container": "#93000a",
          "on-tertiary-fixed-variant": "#753311",
          "background": "#faf9ff",
          "primary-container": "#002f6c",
          "error": "#ba1a1a",
          "on-secondary-container": "#626567",
          "surface-container-highest": "#e3e2e8",
          "surface-container-high": "#e8e7ed",
          "on-surface": "#1a1b20",
          "on-error": "#ffffff",
          "on-background": "#1a1b20",
          "primary-fixed-dim": "#aec6ff",
          "surface": "#faf9ff",
          "outline-variant": "#c4c6d2",
          "surface-variant": "#e3e2e8",
          "inverse-primary": "#aec6ff",
          "surface-dim": "#dad9df",
          "surface-container-lowest": "#ffffff",
          "inverse-on-surface": "#f1f0f6",
          "secondary": "#5c5f61",
          "on-secondary-fixed": "#191c1e",
          "on-primary-fixed": "#001a42",
          "outline": "#747781",
          "secondary-container": "#e0e3e5",
          "primary-fixed": "#d8e2ff",
          "on-tertiary-container": "#db835a",
          "tertiary": "#371000",
          "surface-container": "#eeedf3",
          "inverse-surface": "#2f3035",
          "surface-tint": "#3c5d9c",
          "secondary-fixed": "#e0e3e5",
          "tertiary-fixed": "#ffdbcd",
          "on-tertiary": "#ffffff",
          "on-primary-container": "#7999dc",
          "primary": "#001b44",
          "on-primary-fixed-variant": "#224583",
          "error-container": "#ffdad6",
          "surface-container-low": "#f4f3f9",
          "on-surface-variant": "#434750",
          "on-secondary-fixed-variant": "#444749",
          "secondary-fixed-dim": "#c4c7c9",
          "on-secondary": "#ffffff",
          "surface-bright": "#faf9ff",
          "tertiary-fixed-dim": "#ffb596",
          "on-primary": "#ffffff",
          "on-tertiary-fixed": "#360f00",
          "tertiary-container": "#591f00"
        },
        "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
        },
        "spacing": {
          "stack-lg": "32px",
          "stack-sm": "8px",
          "unit": "8px",
          "gutter": "24px",
          "margin-desktop": "40px",
          "container-max": "1280px",
          "stack-md": "16px",
          "margin-mobile": "16px"
        },
        "fontFamily": {
          "body-md": ["Hanken Grotesk"],
          "headline-lg": ["Hanken Grotesk"],
          "display-lg": ["Hanken Grotesk"],
          "body-lg": ["Hanken Grotesk"],
          "label-md": ["Hanken Grotesk"],
          "display-lg-mobile": ["Hanken Grotesk"],
          "headline-md": ["Hanken Grotesk"],
          "label-sm": ["Hanken Grotesk"]
        },
        "fontSize": {
          "body-md": [
            "16px",
            {
              "lineHeight": "24px",
              "fontWeight": "400"
            }
          ],
          "headline-lg": [
            "32px",
            {
              "lineHeight": "40px",
              "fontWeight": "600"
            }
          ],
          "display-lg": [
            "48px",
            {
              "lineHeight": "56px",
              "letterSpacing": "-0.02em",
              "fontWeight": "700"
            }
          ],
          "body-lg": [
            "18px",
            {
              "lineHeight": "28px",
              "fontWeight": "400"
            }
          ],
          "label-md": [
            "14px",
            {
              "lineHeight": "20px",
              "letterSpacing": "0.01em",
              "fontWeight": "500"
            }
          ],
          "display-lg-mobile": [
            "36px",
            {
              "lineHeight": "44px",
              "fontWeight": "700"
            }
          ],
          "headline-md": [
            "24px",
            {
              "lineHeight": "32px",
              "fontWeight": "600"
            }
          ],
          "label-sm": [
            "12px",
            {
              "lineHeight": "16px",
              "fontWeight": "600"
            }
          ]
        }
      }
    }
  }
};

import { ReactiveElement, css, property, type PropertyValues } from '@folkjs/dom/ReactiveElement';

const cursor = (color: string, scale = 1) => `<svg width="${13 * scale}" height="${
  20 * scale
}" viewBox="0 0 13 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#filter0_d_3001_67)">
    <mask id="path-1-outside-1_3001_67" maskUnits="userSpaceOnUse" x="0.5" y="0.500023" width="11" height="18" fill="black">
      <rect fill="white" x="0.5" y="0.500023" width="11" height="18"/>
      <path d="M10.1455 10.1641H6.26562L9.14355 16.7598L7.19141 17.5791L4.20605 10.7324L1.5 13.3457V1.50002L10.1455 10.1641Z"/>
    </mask>
    <path d="M10.1455 10.1641H6.26562L9.14355 16.7598L7.19141 17.5791L4.20605 10.7324L1.5 13.3457V1.50002L10.1455 10.1641Z" fill="${color}" shape-rendering="crispEdges"/>
    <path d="M10.1455 10.1641V10.9141C10.4487 10.9141 10.7221 10.7315 10.8383 10.4515C10.9544 10.1714 10.8906 9.84895 10.6764 9.63432L10.1455 10.1641ZM6.26562 10.1641V9.41409C6.01265 9.41409 5.77672 9.54162 5.63815 9.75327C5.49958 9.96492 5.47704 10.2322 5.57821 10.464L6.26562 10.1641ZM9.14355 16.7598L9.43381 17.4513C9.61891 17.3737 9.76513 17.225 9.83978 17.0387C9.91442 16.8523 9.91125 16.6438 9.83097 16.4598L9.14355 16.7598ZM7.19141 17.5791L6.50392 17.8789C6.66786 18.2549 7.10344 18.4294 7.48166 18.2707L7.19141 17.5791ZM4.20605 10.7324L4.89354 10.4327C4.79533 10.2074 4.59302 10.0446 4.35199 9.99678C4.11097 9.94897 3.86181 10.0223 3.68505 10.1929L4.20605 10.7324ZM1.5 13.3457H0.75C0.75 13.6467 0.929913 13.9185 1.20696 14.0361C1.484 14.1537 1.80451 14.0943 2.021 13.8852L1.5 13.3457ZM1.5 1.50002L2.0309 0.970262C1.81653 0.75543 1.49381 0.690968 1.21336 0.80696C0.932906 0.922951 0.75 1.19653 0.75 1.50002H1.5ZM10.1455 10.1641V9.41409H6.26562V10.1641V10.9141H10.1455V10.1641ZM6.26562 10.1641L5.57821 10.464L8.45614 17.0597L9.14355 16.7598L9.83097 16.4598L6.95304 9.86414L6.26562 10.1641ZM9.14355 16.7598L8.8533 16.0682L6.90115 16.8876L7.19141 17.5791L7.48166 18.2707L9.43381 17.4513L9.14355 16.7598ZM7.19141 17.5791L7.8789 17.2794L4.89354 10.4327L4.20605 10.7324L3.51857 11.0322L6.50392 17.8789L7.19141 17.5791ZM4.20605 10.7324L3.68505 10.1929L0.978999 12.8062L1.5 13.3457L2.021 13.8852L4.72706 11.2719L4.20605 10.7324ZM1.5 13.3457H2.25V1.50002H1.5H0.75V13.3457H1.5ZM1.5 1.50002L0.969102 2.02978L9.61461 10.6938L10.1455 10.1641L10.6764 9.63432L2.0309 0.970262L1.5 1.50002Z" fill="white" fill-opacity="0.9" mask="url(#path-1-outside-1_3001_67)"/>
  </g>
  <defs>
    <filter id="filter0_d_3001_67" x="0" y="0" width="12.1455" height="19.5793" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="0.25" dy="0.25"/>
      <feGaussianBlur stdDeviation="0.5"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3001_67"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3001_67" result="shape"/>
    </filter>
  </defs>
</svg>`;

const sittingCursor = (color: string, scale = 1) => `<svg width="${13 * scale}" height="${
  21 * scale
}" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_3063_3)">
<mask id="path-1-outside-1_3063_3" maskUnits="userSpaceOnUse" x="-1.16406" y="0.223436" width="16.3802" height="20.6403" fill="black">
<rect fill="white" x="-1.16406" y="0.223436" width="16.3802" height="20.6403"/>
<path d="M10.7117 12.5541L7.02518 11.2478L7.11066 12.7317L8.48573 13.883L8.48712 18.379L6.37342 18.4993L6.37334 13.9996L4.99671 12.8322L4.89766 11.1176L1.50003 12.6655L5.45643 1.50001L10.7117 12.5541Z"/>
</mask>
<path d="M10.7117 12.5541L7.02518 11.2478L7.11066 12.7317L8.48573 13.883L8.48712 18.379L6.37342 18.4993L6.37334 13.9996L4.99671 12.8322L4.89766 11.1176L1.50003 12.6655L5.45643 1.50001L10.7117 12.5541Z" fill="${color}" shape-rendering="crispEdges"/>
<path d="M10.7117 12.5541L10.4612 13.261C10.747 13.3623 11.0657 13.2815 11.2687 13.0563C11.4718 12.8312 11.5193 12.5059 11.3891 12.2321L10.7117 12.5541ZM7.02518 11.2478L7.27568 10.5409C7.0389 10.457 6.77585 10.4972 6.57494 10.648C6.37404 10.7988 6.26198 11.0401 6.27642 11.2909L7.02518 11.2478ZM7.11066 12.7317L6.3619 12.7748C6.3738 12.9814 6.47052 13.1739 6.62917 13.3067L7.11066 12.7317ZM8.48573 13.883L9.23573 13.8828C9.23567 13.6609 9.13735 13.4504 8.96722 13.308L8.48573 13.883ZM8.48712 18.379L8.52973 19.1278C8.92684 19.1052 9.23724 18.7765 9.23712 18.3787L8.48712 18.379ZM6.37342 18.4993L5.62342 18.4993C5.62342 18.7056 5.70841 18.9028 5.85838 19.0444C6.00835 19.1861 6.21006 19.2598 6.41603 19.248L6.37342 18.4993ZM6.37334 13.9996L7.12334 13.9996C7.12334 13.7793 7.02646 13.5701 6.85843 13.4276L6.37334 13.9996ZM4.99671 12.8322L4.24796 12.8754C4.2598 13.0803 4.35509 13.2714 4.51162 13.4042L4.99671 12.8322ZM4.89766 11.1176L5.64641 11.0744C5.63214 10.8273 5.49694 10.6032 5.28506 10.4754C5.07319 10.3476 4.8119 10.3325 4.58673 10.4351L4.89766 11.1176ZM1.50003 12.6655L0.793097 12.415C0.692573 12.6987 0.771375 13.015 0.993244 13.2183C1.21511 13.4217 1.53707 13.4728 1.81096 13.348L1.50003 12.6655ZM5.45643 1.50001L6.13378 1.17798C6.00347 0.903889 5.72082 0.735344 5.41773 0.751005C5.11464 0.766665 4.85087 0.963444 4.7495 1.24951L5.45643 1.50001ZM10.7117 12.5541L10.9622 11.8472L7.27568 10.5409L7.02518 11.2478L6.77469 11.9547L10.4612 13.261L10.7117 12.5541ZM7.02518 11.2478L6.27642 11.2909L6.3619 12.7748L7.11066 12.7317L7.85941 12.6885L7.77394 11.2047L7.02518 11.2478ZM7.11066 12.7317L6.62917 13.3067L8.00425 14.4581L8.48573 13.883L8.96722 13.308L7.59214 12.1566L7.11066 12.7317ZM8.48573 13.883L7.73573 13.8833L7.73712 18.3792L8.48712 18.379L9.23712 18.3787L9.23573 13.8828L8.48573 13.883ZM8.48712 18.379L8.44451 17.6302L6.33081 17.7505L6.37342 18.4993L6.41603 19.248L8.52973 19.1278L8.48712 18.379ZM6.37342 18.4993L7.12342 18.4992L7.12334 13.9996L6.37334 13.9996L5.62334 13.9996L5.62342 18.4993L6.37342 18.4993ZM6.37334 13.9996L6.85843 13.4276L5.4818 12.2602L4.99671 12.8322L4.51162 13.4042L5.88825 14.5716L6.37334 13.9996ZM4.99671 12.8322L5.74546 12.7889L5.64641 11.0744L4.89766 11.1176L4.1489 11.1609L4.24796 12.8754L4.99671 12.8322ZM4.89766 11.1176L4.58673 10.4351L1.1891 11.983L1.50003 12.6655L1.81096 13.348L5.20859 11.8001L4.89766 11.1176ZM1.50003 12.6655L2.20696 12.916L6.16336 1.7505L5.45643 1.50001L4.7495 1.24951L0.793097 12.415L1.50003 12.6655ZM5.45643 1.50001L4.77908 1.82203L10.0344 12.8761L10.7117 12.5541L11.3891 12.2321L6.13378 1.17798L5.45643 1.50001Z" fill="white" fill-opacity="0.9" mask="url(#path-1-outside-1_3063_3)"/>
</g>
<defs>
<filter id="filter0_d_3063_3" x="0" y="0" width="12.7117" height="20.4993" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="0.25" dy="0.25"/>
<feGaussianBlur stdDeviation="0.5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3063_3"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3063_3" result="shape"/>
</filter>
</defs>
</svg>`;

const sittingCursorWithLegsBack = (color: string, scale = 1) => `<svg width="${13 * scale}" height="${
  21 * scale
}" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#filter0_d_3063_8)">
    <mask id="path-1-outside-1_3063_8" maskUnits="userSpaceOnUse" x="-1.16406" y="0.223434" width="16.3802" height="20.6403" fill="black">
      <rect fill="white" x="-1.16406" y="0.223434" width="16.3802" height="20.6403"/>
      <path d="M10.7117 12.5541L7.02518 11.2478L7.11066 12.7317L8.48573 13.883L7.37305 17.9998L5.25935 18.12L6.37334 13.9996L4.99671 12.8322L4.89766 11.1176L1.50003 12.6655L5.45643 1.5L10.7117 12.5541Z"/>
    </mask>
    <path d="M10.7117 12.5541L7.02518 11.2478L7.11066 12.7317L8.48573 13.883L7.37305 17.9998L5.25935 18.12L6.37334 13.9996L4.99671 12.8322L4.89766 11.1176L1.50003 12.6655L5.45643 1.5L10.7117 12.5541Z" fill="${color}" shape-rendering="crispEdges"/>
    <path d="M10.7117 12.5541L10.4612 13.261C10.747 13.3623 11.0657 13.2815 11.2687 13.0563C11.4718 12.8312 11.5193 12.5059 11.3891 12.2321L10.7117 12.5541ZM7.02518 11.2478L7.27568 10.5409C7.0389 10.457 6.77585 10.4972 6.57494 10.648C6.37404 10.7988 6.26198 11.0401 6.27642 11.2909L7.02518 11.2478ZM7.11066 12.7317L6.3619 12.7748C6.3738 12.9814 6.47052 13.1739 6.62917 13.3067L7.11066 12.7317ZM8.48573 13.883L9.20975 14.0787C9.28604 13.7965 9.19137 13.4957 8.96722 13.308L8.48573 13.883ZM7.37305 17.9998L7.41565 18.7485C7.73821 18.7302 8.01277 18.5073 8.09707 18.1954L7.37305 17.9998ZM5.25935 18.12L4.53534 17.9243C4.47245 18.1569 4.52516 18.4056 4.67701 18.5927C4.82887 18.7798 5.06138 18.8825 5.30195 18.8688L5.25935 18.12ZM6.37334 13.9996L7.09735 14.1954C7.17321 13.9148 7.08011 13.6156 6.85843 13.4276L6.37334 13.9996ZM4.99671 12.8322L4.24796 12.8754C4.2598 13.0803 4.35509 13.2714 4.51162 13.4042L4.99671 12.8322ZM4.89766 11.1176L5.64641 11.0744C5.63214 10.8273 5.49694 10.6032 5.28506 10.4754C5.07319 10.3476 4.8119 10.3325 4.58673 10.4351L4.89766 11.1176ZM1.50003 12.6655L0.793097 12.415C0.692573 12.6987 0.771375 13.015 0.993244 13.2183C1.21511 13.4217 1.53707 13.4728 1.81096 13.348L1.50003 12.6655ZM5.45643 1.5L6.13378 1.17798C6.00347 0.903887 5.72082 0.735342 5.41773 0.751003C5.11464 0.766664 4.85087 0.963443 4.7495 1.24951L5.45643 1.5ZM10.7117 12.5541L10.9622 11.8472L7.27568 10.5409L7.02518 11.2478L6.77469 11.9547L10.4612 13.261L10.7117 12.5541ZM7.02518 11.2478L6.27642 11.2909L6.3619 12.7748L7.11066 12.7317L7.85941 12.6885L7.77394 11.2047L7.02518 11.2478ZM7.11066 12.7317L6.62917 13.3067L8.00425 14.4581L8.48573 13.883L8.96722 13.308L7.59214 12.1566L7.11066 12.7317ZM8.48573 13.883L7.76171 13.6873L6.64903 17.8041L7.37305 17.9998L8.09707 18.1954L9.20975 14.0787L8.48573 13.883ZM7.37305 17.9998L7.33044 17.251L5.21674 17.3712L5.25935 18.12L5.30195 18.8688L7.41565 18.7485L7.37305 17.9998ZM5.25935 18.12L5.98335 18.3158L7.09735 14.1954L6.37334 13.9996L5.64933 13.8039L4.53534 17.9243L5.25935 18.12ZM6.37334 13.9996L6.85843 13.4276L5.4818 12.2602L4.99671 12.8322L4.51162 13.4042L5.88825 14.5716L6.37334 13.9996ZM4.99671 12.8322L5.74546 12.7889L5.64641 11.0744L4.89766 11.1176L4.1489 11.1609L4.24796 12.8754L4.99671 12.8322ZM4.89766 11.1176L4.58673 10.4351L1.1891 11.983L1.50003 12.6655L1.81096 13.348L5.20859 11.8001L4.89766 11.1176ZM1.50003 12.6655L2.20696 12.916L6.16336 1.7505L5.45643 1.5L4.7495 1.24951L0.793097 12.415L1.50003 12.6655ZM5.45643 1.5L4.77908 1.82203L10.0344 12.8761L10.7117 12.5541L11.3891 12.2321L6.13378 1.17798L5.45643 1.5Z" fill="white" fill-opacity="0.9" mask="url(#path-1-outside-1_3063_8)"/>
  </g>
  <defs>
    <filter id="filter0_d_3063_8" x="0" y="0" width="12.7117" height="20.12" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="0.25" dy="0.25"/>
      <feGaussianBlur stdDeviation="0.5"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3063_8"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3063_8" result="shape"/>
    </filter>
  </defs>
</svg>`;

const sittingCursorWithLegsForward = (color: string, scale = 1) => `<svg width="${13 * scale}" height="${
  21 * scale
}" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#filter0_d_3063_18)">
    <mask id="path-1-outside-1_3063_18" maskUnits="userSpaceOnUse" x="-0.830059" y="0.223434" width="16.9888" height="20.0317" fill="black">
      <rect fill="white" x="-0.830059" y="0.223434" width="16.9888" height="20.0317"/>
      <path d="M10.7117 12.5541L7.02518 11.2478L7.11066 12.7317L8.48574 13.883L9.87305 17.9998L7.75935 18.1201L6.37334 13.9996L4.99671 12.8322L4.89766 11.1176L1.50003 12.6655L5.45643 1.5L10.7117 12.5541Z"/>
    </mask>
    <path d="M10.7117 12.5541L7.02518 11.2478L7.11066 12.7317L8.48574 13.883L9.87305 17.9998L7.75935 18.1201L6.37334 13.9996L4.99671 12.8322L4.89766 11.1176L1.50003 12.6655L5.45643 1.5L10.7117 12.5541Z" fill="${color}" shape-rendering="crispEdges"/>
    <path d="M10.7117 12.5541L10.4612 13.261C10.747 13.3623 11.0657 13.2815 11.2687 13.0563C11.4718 12.8312 11.5193 12.5059 11.3891 12.2321L10.7117 12.5541ZM7.02518 11.2478L7.27568 10.5409C7.0389 10.457 6.77585 10.4972 6.57495 10.648C6.37404 10.7988 6.26198 11.0401 6.27642 11.2909L7.02518 11.2478ZM7.11066 12.7317L6.3619 12.7748C6.3738 12.9814 6.47052 13.1739 6.62917 13.3067L7.11066 12.7317ZM8.48574 13.883L9.19646 13.6435C9.15238 13.5127 9.07306 13.3966 8.96722 13.308L8.48574 13.883ZM9.87305 17.9998L9.91565 18.7486C10.1493 18.7353 10.3633 18.6137 10.4944 18.4198C10.6254 18.226 10.6585 17.982 10.5838 17.7603L9.87305 17.9998ZM7.75935 18.1201L7.04848 18.3592C7.15619 18.6794 7.46467 18.888 7.80195 18.8688L7.75935 18.1201ZM6.37334 13.9996L7.0842 13.7605C7.04066 13.6311 6.96259 13.516 6.85843 13.4276L6.37334 13.9996ZM4.99671 12.8322L4.24796 12.8754C4.2598 13.0803 4.35509 13.2714 4.51162 13.4042L4.99671 12.8322ZM4.89766 11.1176L5.64641 11.0744C5.63214 10.8273 5.49694 10.6032 5.28506 10.4754C5.07319 10.3476 4.8119 10.3325 4.58673 10.4351L4.89766 11.1176ZM1.50003 12.6655L0.793098 12.415C0.692574 12.6987 0.771376 13.015 0.993245 13.2183C1.21511 13.4217 1.53707 13.4728 1.81096 13.348L1.50003 12.6655ZM5.45643 1.5L6.13378 1.17798C6.00347 0.903887 5.72082 0.735342 5.41773 0.751003C5.11464 0.766664 4.85087 0.963443 4.7495 1.24951L5.45643 1.5ZM10.7117 12.5541L10.9622 11.8472L7.27568 10.5409L7.02518 11.2478L6.77469 11.9547L10.4612 13.261L10.7117 12.5541ZM7.02518 11.2478L6.27642 11.2909L6.3619 12.7748L7.11066 12.7317L7.85942 12.6885L7.77394 11.2047L7.02518 11.2478ZM7.11066 12.7317L6.62917 13.3067L8.00425 14.4581L8.48574 13.883L8.96722 13.308L7.59214 12.1566L7.11066 12.7317ZM8.48574 13.883L7.77501 14.1225L9.16232 18.2393L9.87305 17.9998L10.5838 17.7603L9.19646 13.6435L8.48574 13.883ZM9.87305 17.9998L9.83044 17.251L7.71674 17.3713L7.75935 18.1201L7.80195 18.8688L9.91565 18.7486L9.87305 17.9998ZM7.75935 18.1201L8.47021 17.8809L7.0842 13.7605L6.37334 13.9996L5.66248 14.2387L7.04848 18.3592L7.75935 18.1201ZM6.37334 13.9996L6.85843 13.4276L5.4818 12.2602L4.99671 12.8322L4.51162 13.4042L5.88825 14.5716L6.37334 13.9996ZM4.99671 12.8322L5.74546 12.7889L5.64641 11.0744L4.89766 11.1176L4.14891 11.1609L4.24796 12.8754L4.99671 12.8322ZM4.89766 11.1176L4.58673 10.4351L1.1891 11.983L1.50003 12.6655L1.81096 13.348L5.20859 11.8001L4.89766 11.1176ZM1.50003 12.6655L2.20696 12.916L6.16336 1.7505L5.45643 1.5L4.7495 1.24951L0.793098 12.415L1.50003 12.6655ZM5.45643 1.5L4.77908 1.82203L10.0344 12.8761L10.7117 12.5541L11.3891 12.2321L6.13378 1.17798L5.45643 1.5Z" fill="white" fill-opacity="0.9" mask="url(#path-1-outside-1_3063_18)"/>
  </g>
  <defs>
    <filter id="filter0_d_3063_18" x="0" y="0" width="12.7117" height="20.1201" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="0.25" dy="0.25"/>
      <feGaussianBlur stdDeviation="0.5"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3063_18"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3063_18" result="shape"/>
    </filter>
  </defs>
</svg>`;

function clamp(min: number, value: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const convertSVGIntoCssURL = (svg: string) => `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;

const CURSOR_COLOR = '#4f9c15';
const CURSOR_SCALE = 1.5;

export class SittingCursor extends ReactiveElement {
  static tagName = 'sitting-cursor';

  static styles = css`
    :host {
      display: inline-block;
      position: absolute;
      top: -4px;
      left: 0;
      width: 20px;
      aspect-ratio: 13 / 21;
      transform-origin: center 60%;
      pointer-events: none;
    }

    div {
      background-size: contain;
      background-repeat: no-repeat;
      height: 100%;
      width: 100%;
    }
  `;

  @property({ type: String, reflect: true }) color = 'black';

  @property({ type: Number, reflect: true }) x = 0;

  @property({ type: String, reflect: true }) legs: 'forwards' | 'backwards' | '' = '';

  #cursorEl = document.createElement('div');

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    root.appendChild(this.#cursorEl);

    return root;
  }

  protected override async update(changedProperties: PropertyValues<this>) {
    super.update(changedProperties);

    if (changedProperties.has('color') || changedProperties.has('legs')) {
      let bg;

      if (this.legs === 'forwards') {
        bg = sittingCursorWithLegsForward(this.color);
      } else if (this.legs === 'backwards') {
        bg = sittingCursorWithLegsBack(this.color);
      } else {
        bg = sittingCursor(this.color);
      }
      this.#cursorEl.style.backgroundImage = convertSVGIntoCssURL(bg);
    }

    const previousX = changedProperties.get('x');
    if (previousX !== undefined) {
      this.style.left = '';
      this.style.rotate = '';
      const direction = Math.sign(this.x - previousX);
      const animation = this.animate(
        [
          { left: previousX + 'px', rotate: '0deg' },
          { left: previousX + 'px', rotate: direction * 10 + 'deg' },
          { left: this.x + 'px', rotate: direction * -7 + 'deg' },
          { left: this.x + 'px', rotate: '0deg' },
        ],
        {
          duration: 300,
          fill: 'forwards',
        }
      );

      await animation.finished;
      // console.log(animation.pending);
      animation.commitStyles();

      // // Cancel the animation because of fill mode
      animation.cancel();
    } else {
      this.style.left = this.x + 'px';
    }
  }

  moveLeft() {
    this.x -= 1;
  }

  moveRight() {
    this.x += 1;
  }
}

export class CursorBench extends ReactiveElement {
  static tagName = 'cursor-bench';

  static define() {
    SittingCursor.define();
    super.define();
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
      pointer-events: all;
      background-size: contain;
      background-repeat: no-repeat;
      /* 183 x 90 */
      background-image: url('/bench.webp');
      aspect-ratio: 2.03;
      width: 60px;
    }
  `;

  static {
    const globalStyles = new CSSStyleSheet();

    globalStyles.insertRule(`
      body {
        cursor: ${convertSVGIntoCssURL(cursor(CURSOR_COLOR, CURSOR_SCALE))}, auto;

        &:has(cursor-bench:state(sitting)) {
          cursor: ${convertSVGIntoCssURL(cursor(CURSOR_COLOR + '51', CURSOR_SCALE))}, auto;
          pointer-event: none;
        }
      }
    `);

    document.adoptedStyleSheets.push(globalStyles);
  }

  #internals = this.attachInternals();
  #sittingCursor: SittingCursor | null = null;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();

    this.addEventListener('click', this.#onClick);

    return root;
  }

  #onClick = (event: PointerEvent) => {
    if (this.#sittingCursor) {
      this.#sittingCursor.remove();
      this.#sittingCursor = null;
      document.removeEventListener('keydown', this.#onKeydown);
      document.removeEventListener('keyup', this.#onKeyup);
      this.#internals.states.delete('sitting');
    } else {
      this.#internals.states.add('sitting');

      document.addEventListener('keydown', this.#onKeydown);
      document.addEventListener('keyup', this.#onKeyup);

      const rect = this.getBoundingClientRect();
      this.#sittingCursor = document.createElement('sitting-cursor');
      this.#sittingCursor.color = CURSOR_COLOR;
      this.renderRoot.append(this.#sittingCursor);
      this.#sittingCursor.x = clamp(0, event.pageX - rect.x, this.offsetWidth) - this.#sittingCursor.offsetWidth / 2;
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (this.#sittingCursor === null) return;
    event.preventDefault();
    if (event.code === 'ArrowLeft' && this.#sittingCursor.x > 0) {
      this.#sittingCursor.moveLeft();
    } else if (event.code === 'ArrowRight' && this.#sittingCursor.x + this.#sittingCursor.offsetWidth <= this.offsetWidth) {
      this.#sittingCursor.moveRight();
    } else if (event.code === 'ArrowUp') {
      this.#sittingCursor.legs = 'forwards';
    } else if (event.code === 'ArrowDown') {
      this.#sittingCursor.legs = 'backwards';
    }
  };

  #onKeyup = (event: KeyboardEvent) => {
    if (this.#sittingCursor === null) return;

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      this.#sittingCursor.legs = '';
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'cursor-bench': CursorBench;
    'sitting-cursor': SittingCursor;
  }
}

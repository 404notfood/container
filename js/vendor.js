/* ========================================
   vendor.js — CDN dependencies loader
   Injects highlight.js, JSZip & FileSaver
   Uses async=false to preserve execution order
   ======================================== */
(function () {
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs';
  var HLJS = CDN + '/highlight.js/11.9.0';

  var scripts = [
    { src: HLJS + '/highlight.min.js', integrity: 'sha512-D9gUyxqja7hBtkWpPWGt9wfbfaMGVt9gnyCvYa+jojwwPHLCzUm5i8rpk7vD7wNee9bA35eYIjobYPaQuKS1MQ==' },
    { src: HLJS + '/languages/yaml.min.js', integrity: 'sha512-ua2qDFSOqEpuYTjyTTmn8L1hY4sQEZGPzu30sBKqUmZO7ky5IcfYYeYjAHKeEkO2Qf3zlUzVEli9mPPLEfovlA==' },
    { src: HLJS + '/languages/dockerfile.min.js', integrity: 'sha512-y0uGK4Ql/eJrIn2uOu2Hfc/3wnQpAHlEF58pL7akgWaVnuOJ8D5Aal/VPRKyMGADVuAavg1yVdLUpn9PlnGmYA==' },
    { src: HLJS + '/languages/nginx.min.js', integrity: 'sha512-8IL2n2grBY6xisj2Mk+31yI1tw6zoYdH+MsZbD+lpU8poLYhuUw78HDEXgSaSFuHD8++94Adra1Z97sgAdX91g==' },
    { src: HLJS + '/languages/ini.min.js', integrity: 'sha512-l5tdeYWLczJuljMotJAdRq5FXa7yoZzvK+C6rhqciT/o0J1qdaT2CKbPltIhaKORmC6XUOUQ33a4abcU7wacpQ==' },
    { src: HLJS + '/languages/bash.min.js', integrity: 'sha512-i0JFeiLhgBAMGfIEVqMQwALhhse1orgl34XyotSUNiNbDIB1qS9IK53sDochCIrwvj4nJ51CsDSOqhGyhZITGg==' },
    { src: HLJS + '/languages/markdown.min.js', integrity: 'sha512-OPn2UK2VPojF+Hh0tfLSMiaKfP0MpRfam/6Q9VVA7LK070PkQxvffqe6chqyp6R2Ml2K7+VOdxEbMpjIKwnCAw==' },
    { src: HLJS + '/languages/php.min.js', integrity: 'sha512-3jC1jPxa1EFMDjrszKdUOQ4MwWCVtk+cbhci1HyBf5n1U9Dkd72d3wMVsmC+xDXSnaLFSiBhkjaQO0ESMdnJiw==' },
    { src: HLJS + '/languages/python.min.js', integrity: 'sha512-wW8K3TEH5ZViD4aMPzwPdhXKs/Kb5MAm7qLRd3QliYlHy0u9utSKZsZzqlZAgJ9xxXp81acwnrZVZ8oTfoLG1g==' },
    { src: HLJS + '/languages/java.min.js', integrity: 'sha512-sQgzBflUTahXrlGeMqS6Z+ugjLta005qmvARRaCSEJ8aflXe03DNo8VzxCDHGzqAUqe1+iRnLfCP5ivekMZnGA==' },
    { src: HLJS + '/languages/typescript.min.js', integrity: 'sha512-GsPn8jZedZaPLThVdRVJ9kvS02HmLZBsoC9qon3IZE8Al7pUBlDIK4IzAtMbxtZ2GtLMFhHusOLTwf2JIDr0oA==' },
    { src: HLJS + '/languages/properties.min.js', integrity: 'sha512-ZBr5T1y0JVAWO/WjfBn1flDXUqe5GT92/f4WKww5Y1vrXBUWs5+9LhSIZE44q0O00uhcWytP0FlikN5/vZXm3Q==' },
    { src: CDN + '/jszip/3.10.1/jszip.min.js', integrity: 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==' },
    { src: CDN + '/FileSaver.js/2.0.5/FileSaver.min.js', integrity: 'sha512-Qlv6VSKh1gDKGoJbnyA5RMXYcvnpIqhO++MhIM2fStMcGT9i2T//tSwYFlcyoRRDcDZ+TYHpH8azBBCyhpSeqw==' }
  ];

  var head = document.head;
  scripts.forEach(function (s) {
    var el = document.createElement('script');
    el.src = s.src;
    el.async = false;
    el.crossOrigin = 'anonymous';
    el.referrerPolicy = 'no-referrer';
    if (s.integrity) el.integrity = s.integrity;
    head.appendChild(el);
  });
})();

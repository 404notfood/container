/* ========================================
   vendor.js — CDN dependencies loader
   Injects highlight.js, JSZip & FileSaver
   Uses async=false to preserve execution order
   ======================================== */
(function () {
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs';
  var HLJS = CDN + '/highlight.js/11.9.0';

  var scripts = [
    { src: HLJS + '/highlight.min.js', integrity: 'sha512-D9gUyxqja+j4aAznSlk4ceVLSQjkMNu1t+2Vk3kB5eRzOXPl3DZLp+QDBvL34bGkhBLEOQ7/q3GN5a1ORjCKWQ==' },
    { src: HLJS + '/languages/yaml.min.js', integrity: 'sha512-SYsqEcYEGHLvEZBSEdRi3pjXKGLE4DLN4DqyUJbhdjdOSCmCEGO6xR1o8p3VGnN1Yg3fLPCHJMJOAYP3E7cHQg==' },
    { src: HLJS + '/languages/dockerfile.min.js', integrity: 'sha512-v/7eZQ0tRJlZ5AYqVKJcQnJZFjrC36L3vOH8x6cg9TUcPMy4i8uIIlzBa0KNLxBHEv6t7YHKqpYbqzfmECDhOQ==' },
    { src: HLJS + '/languages/nginx.min.js', integrity: 'sha512-WE3s/OC+OYW1RKvTBMXpVdOelLHBxEGArFdN5J6YgHXkqBaUyqGLYs5cXVAKdCkBp8d/LPEyDHj4r7Cw2oLu8w==' },
    { src: HLJS + '/languages/ini.min.js', integrity: 'sha512-XMVcYCzh+1PuTUxlPMVhDHDe5K2x1JlqJOQPBwMbDQfN5kW4v1YuOFTY3+KxGqLqyJpZiWRPFDz1CpUMXhcHqA==' },
    { src: HLJS + '/languages/bash.min.js', integrity: 'sha512-hsVk9jWF8zLQUOWi7N+WIbSNJ8lXtSs/NQCmswHM7mJMz5YdWSKTR2Jz5lnHs/vNUaG04eeBMRYqn3vYsH2pFg==' },
    { src: HLJS + '/languages/markdown.min.js', integrity: 'sha512-eIUlGEgqA5pOq1yHhfKdxVxT5m/W2u0Z2T1cJ0rqSi9C/qHqQNVzOa6NRZVx2UtK0uAG8FP/b8YwEv6VBNhPyg==' },
    { src: HLJS + '/languages/php.min.js', integrity: 'sha512-LQD3WNdE1KfKOPpFfYQ7p8cqLEbH9zPBQB7r/6qABZ9z6hOSK+PtNH9xqALBJCLTxqCH0gSQvD0l8YK0T1+HAQ==' },
    { src: HLJS + '/languages/python.min.js', integrity: 'sha512-Y5wjvGCOHGIvvT75Qh5fT2sLlGqQ0pFGdVLZ/EMaSvAkAp2pTnP1PZcQhXx2GRIZiCDYiU7LJPPwGIxL8LAOOg==' },
    { src: HLJS + '/languages/java.min.js', integrity: 'sha512-dSwRjJu/VhTAVqOQaP8xXQGfVYd9L2QQPx/Z0xMJdmGq0Y8VfUMBEtJOPEgjdj4h7yqYXS+0uJrq2tD7gBhckg==' },
    { src: HLJS + '/languages/typescript.min.js', integrity: 'sha512-xv8PJmWxvvVEQbGLLQW+1NQpH4P5hR/xeGBB8D6vO5N+LzQqHGqRfhBYpELgcJJfqQmUPm8sWBCJ+0j0sXOjBg==' },
    { src: HLJS + '/languages/properties.min.js', integrity: 'sha512-9qPJKvXKHYEShAZYa13Ry95qXQQU+vXyxGCLj/RYfHhPzg3tLRz+CIYF5bhOm1eLKZBRqLwW1NWDPX2EyWQJ7w==' },
    { src: CDN + '/jszip/3.10.1/jszip.min.js', integrity: 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==' },
    { src: CDN + '/FileSaver.js/2.0.5/FileSaver.min.js', integrity: 'sha512-P9bmyZ3h/PRnGQ4nRxfDRXn6YzU6xPCvHyLvVGTvmPWqEF3PzBMqjXdPfBkXmgJVwbBUGLQEQ0yinC3I0LpNsg==' }
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

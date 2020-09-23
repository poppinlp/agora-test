
const code = "#root {\n  display: flex;\n  height: 100vh;\n  flex-direction: column;\n}\n\nheader {\n  padding: 15px 20px;\n  font-size: 20px;\n  color: #fff;\n  background-color: #018786;\n}\n\nmain {\n  display: flex;\n  flex: auto;\n}\n\naside {\n  width: 25vw;\n  min-width: 300px;\n  max-width: 400px;\n  background-color: #03dac6;\n}\n\nsection {\n  display: flex;\n  flex: auto;\n  flex-direction: column;\n}\n\n.stream_wrapper {\n  height: 320px;\n  width: 480px;\n}";

const styleEl = document.createElement("style");
const codeEl = document.createTextNode(code);
styleEl.type = 'text/css';

styleEl.appendChild(codeEl);
document.head.appendChild(styleEl);
// MessageChannel polyfill for Cloudflare Workers
if (typeof MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      const { port1, port2 } = this.createPorts();
      this.port1 = port1;
      this.port2 = port2;
    }

    createPorts() {
      const listeners1 = new Set();
      const listeners2 = new Set();

      const port1 = {
        postMessage: (data) => {
          listeners2.forEach(listener => {
            setTimeout(() => listener({ data }), 0);
          });
        },
        addEventListener: (type, listener) => {
          if (type === 'message') listeners1.add(listener);
        },
        removeEventListener: (type, listener) => {
          if (type === 'message') listeners1.delete(listener);
        },
        start: () => {},
        close: () => {},
      };

      const port2 = {
        postMessage: (data) => {
          listeners1.forEach(listener => {
            setTimeout(() => listener({ data }), 0);
          });
        },
        addEventListener: (type, listener) => {
          if (type === 'message') listeners2.add(listener);
        },
        removeEventListener: (type, listener) => {
          if (type === 'message') listeners2.delete(listener);
        },
        start: () => {},
        close: () => {},
      };

      return { port1, port2 };
    }
  };
}
// DOM helpers for the demo.
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function on(node, eventName, handler) {
  if (!node) {
    return;
  }
  node.addEventListener(eventName, handler);
}

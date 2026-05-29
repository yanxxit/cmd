// DOM helpers.
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function on(node, eventName, handler) {
  if (!node) {
    return;
  }
  node.addEventListener(eventName, handler);
}

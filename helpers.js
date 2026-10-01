///////////////////////////////// Helpers ////////////////////////////////////////////////

const debug = false;

function $(selector) {
    const element = document.querySelector(selector);
    if (debug && element == null) {
        $error("Element not found: " + selector);
    }
    return element;
}

function $$(selector) {
    const elements = document.querySelectorAll(selector);
    if (debug && elements.length === 0) {
        $error("Elements not found: " + selector);
    }
    return elements;
}

const $url = document.location.href;

function $open(url) {
    window.location.href = url;
}

function $openBlank(url) {
    window.open(url, "_blank");
}

function $create(tag) {
    return document.createElement(tag);
}

function $alert(message) {
    alert(message);
}

function $error(message) {
    console.error(message);
}

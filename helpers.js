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

function $shadow(selector) {
    const element = document.querySelector(selector);
    if (debug && element == null) {
        $error("Shadow element not found: " + selector);
    }
    return element.shadowRoot;
}

function $shadowSelector($shadowSelector, selector) {
    const element = $shadow($shadowSelector).querySelector(selector);
    if (debug && element == null) {
        $error("Shadow sub element not found: " + selector);
    }
    return element;
}

function $shadowSelectorAll($shadowSelector, selector) {
    const elements = $shadow($shadowSelector).querySelectorAll(selector);
    if (debug && elements.length === 0) {
        $error("Shadow sub elements not found: " + selector);
    }
    return elements;
}

// r: $each("div", (element) => { $style(element, { color: "red" }); });
function $style(element, style) {
    if (element != null) {
        for (const key in style) {
            element.style[key] = style[key];
        }
        return true;
    }
    else if (debug) {
        $error("style on a null element");
    }
    return false;
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

function $log(message) {
    console.log(message);
}

function $error(message) {
    console.error(message);
}

function $warn(message) {
    console.warn(message);
}

function $info(message) {
    console.info(message);
}

function $debug(message) {
    console.debug(message);
}

function $scrollToTop() {
    window.scrollTo(0, 0);
}

function $scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

function $scrollTo(x, y) {
    window.scrollTo(x, y);
}

function $scrollBy(x, y) {
    window.scrollBy(x, y);
}

function $get(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (debug) {
                if (xhr.status === 200) {
                    $info("Success get " + url);
                }
                else {
                    $error("Error get " + url);
                }
                $debug(xhr.responseText);
            }
            if (xhr.status === 200) {
                callback(xhr.responseText);
            }
        }
    };
    xhr.send();
}

function $post(url, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (debug) {
                if (xhr.status === 200) {
                    $info("Success post " + url);
                }
                else {
                    $error("Error post " + url);
                }
                $debug(xhr.responseText);
            }
            if (xhr.status === 200) {
                callback(xhr.responseText);
            }
        }
    };
    xhr.send(JSON.stringify(data));
}

function $scrollIntoView(element) {
    if (element != null) {
        element.scrollIntoView();
    }
    else if (debug) {
        $error("scrollIntoView on a null element");
    }
}

function $click(element) {
    if (element != null) {
        element.click();
    }
    else if (debug) {
        $error("click on a null element");
    }
}

function $focus(element) {
    if (element != null) {
        element.focus();
    }
    else if (debug) {
        $error("focus on a null element");
    }
    element.focus();
    console.log(element);
    console.log(document.activeElement);
}

function $blur(element) {
    if (element != null) {
        element.blur();
    }
    else if (debug) {
        $error("blur on a null element");
    }
}

function $select(element) {
    if (element != null) {
        element.select();
    }
    else if (debug) {
        $error("select on a null element");
    }
}

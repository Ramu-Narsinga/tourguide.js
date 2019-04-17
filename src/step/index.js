import u from "umbrellajs";
import scrollIntoView from "scroll-into-view";
import { clamp, getDataContents, getBoundingClientRect, getViewportRect } from "../utils";
// data-step="title: Step1; content: .../<>"
export default class Step {
    index = 0;
    first = false;
    last = false;
    target = null;
    container = null;
    highlight = null;
    tooltip = null;
    arrow = null;
    rect = {};
    image = null;
    title = "";
    content = "";
    active = false;
    context = null;
    _target = null;
    get el() {
        if (!this.container) {
            const image = u(`<div role="figure" class="guided-tour-step-image">${this.image ? `<img src="${this.image}" />` : ""}</div>`);
            const title = u(`<div role="heading" class="guided-tour-step-title">${this.title}</div>`);
            const content = u(`<div class="guided-tour-step-content">${this.content}</div>`);
            const footer = u(`<div class="guided-tour-step-footer">
                <span role="button" class="guided-tour-step-button guided-tour-step-button-close" title="End tour">
                    <svg class="guided-tour-icon" viewBox="0 0 20 20" width="16" height="16"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#tour-icon-close"></use></svg>
                </span>
                ${this.last ? `<span role="button" class="guided-tour-step-button guided-tour-step-button-complete" title="Complete tour">
                        <svg class="guided-tour-icon" viewBox="0 0 20 20" width="32" height="32"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#tour-icon-complete"></use></svg>
                    </span>`:
                    `<span role="button" class="guided-tour-step-button guided-tour-step-button-next" title="Next step">
                        <svg class="guided-tour-icon" viewBox="0 0 20 20" width="32" height="32"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#tour-icon-next"></use></svg>
                    </span>`}
                ${this.context._steps.length > 1 ? `<div class="guided-tour-step-footer-bullets">
                    <ul>${this.context._steps.map((step, i) => `<li  title="Go to step ${i + 1}" data-index="${i}" class="${step.index < this.index ? "complete" : step.index == this.index ? "current" : ""}"></li>`).join("")}</ul>
                </div>` : ""}
            </div>`);
            footer.find(".guided-tour-step-button-next").on("click", this.context.next);
            footer.find(".guided-tour-step-button-close").on("click", this.context.stop);
            footer.find(".guided-tour-step-button-complete").on("click", this.context.complete);
            footer.find(".guided-tour-step-footer-bullets li").on("click", (e) => this.context.go(parseInt(u(e.target).data("index"))));
            const highlight = this.highlight = u(`<div class="guided-tour-step-highlight"></div>`);
            highlight.on("click", this.context.action);
            const tooltip = this.tooltip = u(`<div role="tooltip" class="guided-tour-step-tooltip"></div>`);
            const arrow = this.arrow = u(`<div aria-hidden="true" class="guided-tour-arrow"></div>`);
            tooltip.append(arrow).append(image).append(title).append(content).append(footer);
            this.container = u(`<div role="dialog" class="guided-tour-step${this.first ? " guided-tour-step-first" : ""}${this.last ? " guided-tour-step-last" : ""}"></div>`);
            this.container.append(highlight).append(tooltip);
        }
        return this.container;
    }
    get target() {
        return this._target || u(this.selector).first();
    }
    set target(target) {
        this._target = target;
    }
    constructor(step, context) {
        this.context = context;
        if (step.hasOwnProperty("title")) {
            this.selector = step.selector;
            this.index = step.step || 0;
            this.title = step.title;
            this.content = step.content || "";
            this.image = step.image;
        } else {
            this.target = step;
            const data = getDataContents(u(step).data("tour"));
            this.index = parseInt(data.step);
            this.title = data.title;
            this.content = data.content;
            this.image = data.image;
        }
    }
    attach(root = "body") {
        u(root).append(this.el);
    }
    remove() {
        this.hide();
        this.el.remove();
    }
    position() {
        // {"left":0,"right":400,"top":0,"height":300,"bottom":300,"width":400}
        if (this.target) {
            const rect = getBoundingClientRect(this.target);
            const view = getViewportRect();
            let style = this.highlight.first().style;
            style.top = `${rect.top - this.context.options.padding}px`;
            style.left = `${rect.left - this.context.options.padding}px`;
            style.width = `${rect.width + this.context.options.padding * 2}px`;
            style.height = `${rect.height + this.context.options.padding * 2}px`;
            const tooltip = this.tooltip;
            const arrow = this.arrow;
            style = tooltip.first().style;
            style.opacity = 0.1;
            // Compute vertical position
            if (view.height / 2 > rect.top) {
                tooltip.addClass("guided-tour-arrow-top");
                style.top = `${rect.top + rect.height}px`;
            } else {
                tooltip.addClass("guided-tour-arrow-bottom");
                style.bottom = `${view.height - rect.top}px`;
            }
            // Compute horizontal position
            if (view.width / 2 > rect.left) {
                style.left = `${rect.left}px`;
                arrow.first().style.left = (rect.width > 400) ? "18px" : `${clamp(rect.width / 2, 14, 386)}px`;
            } else {
                style.right = `${Math.max(view.width - rect.right, 40)}px`;
                arrow.first().style.right = (view.width - rect.right) < 40 ||
                    (rect.width > 400) ? "8px" : `${clamp(rect.width / 2 - 8, 14, 386)}px`;
            }
        } else {
            const view = getViewportRect();
            let style = this.highlight.first().style;
            style.top = `${0}px`;
            style.left = `${0}px`;
            style.width = `${0}px`;
            style.height = `${0}px`;
            const tooltip = this.tooltip;
            style = tooltip.first().style;
            style.opacity = 0.1;
            style.top = `${view.height / 2}px`;
            style.left = `${view.width / 2}px`;
            tooltip.addClass("guided-tour-arrow-none");
            tooltip.addClass("guided-tour-center");
        }
    }
    adjust() {
        const rect = getBoundingClientRect(this.tooltip);
        const view = getViewportRect();
        let style = this.tooltip.first().style;
        if (rect.top < 0) {
            style.top = "8px";
        }
        if (rect.top > view.height - rect.height) {
            style.top = `${view.height - rect.height - 40}px`;
        }
        if (rect.left < 0) {
            style.left = "8px";
        }
        if (rect.right < 40) {
            style.right = "40px";
        }
        style.opacity = 1;
    }
    show() {
        const show = () => {
            this.position();
            this.el.addClass("active");
            this.adjust();
        }
        if (this.target) {
            scrollIntoView(this.target, {
                time: this.context.options.animationspeed
            }, show);
        } else setTimeout(show, this.context.options.animationspeed);
    }
    hide() {
        this.el.removeClass("active");
        this.tooltip.removeClass("guided-tour-arrow-top");
    }
    toJSON() {
        return {
            index,
            title,
            contnet,
            image,
            active
        } = this;
    }
}
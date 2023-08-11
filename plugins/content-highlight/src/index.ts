/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A plugin that highlights the content on the workspace.
 */

import * as Blockly from 'blockly';

/**
 * List of events that cause a change in content area size.
 */
const CONTENT_CHANGE_EVENTS_ = [
  Blockly.Events.VIEWPORT_CHANGE,
  Blockly.Events.BLOCK_MOVE,
  Blockly.Events.BLOCK_DELETE,
];

/**
 * The default padding to use for the content highlight in workspace units.
 */
const DEFAULT_PADDING_ = 10;

/**
 * Length of opacity change transition in seconds.
 */
const ANIMATION_TIME = 0.25;

/**
 * A plugin that highlights the area where content exists on the workspace.
 */
export class ContentHighlight {
  /**
   * The width of the highlight rectangle in workspace units.
   */
  private width_ = 0;
  
  /**
   * The height of the highlight rectangle in workspace units.
   */
  private height_ = 0;
  
  /**
   * The top offset of the highlight rectangle in pixels.
   */
  private top_ = 0;
  
  /**
   * The left offset of the highlight rectangle in pixels.
   */
  private left_ = 0;
  
  /**
   * The last scale value applied on the content highlight.
   */
  private lastScale_ = 1;
  
  /**
   * The cached content metrics for the workspace in workspace units.
   */
  private cachedContentMetrics_?: Blockly.MetricsManager.ContainerRegion;
  
  /**
   * The padding to use around the content area.
   */
  private padding_ = DEFAULT_PADDING_;
  
  private svgGroup_?: SVGGElement;
  private rect_?: SVGRectElement;
  private background_?: SVGRectElement;
  private onChangeWrapper_?: () => void;

  /**
   * Constructor for the content highlight plugin.
   * @param workspace The workspace that the plugin will be added to.
   */
  constructor(protected workspace_: Blockly.WorkspaceSvg) {}

  /**
   * Initializes the plugin.
   * @param padding The padding to use for the content area highlight
   *    rectangle, in workspace units.
   */
  init(padding: number) {
    padding = Number(padding);

    this.padding_ = isNaN(padding) ? DEFAULT_PADDING_ : padding;

    /** @type {SVGElement} */
    this.svgGroup_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.G,
        {'class': 'contentAreaHighlight'}, null);

    const rnd = String(Math.random()).substring(2);
    const mask = Blockly.utils.dom.createSvgElement(
        new Blockly.utils.Svg('mask'), {
          'id': 'contentAreaHighlightMask' + rnd,
        }, this.svgGroup_);
    Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.RECT, {
          'x': 0,
          'y': 0,
          'width': '100%',
          'height': '100%',
          'fill': 'white',
        }, mask);
    this.rect_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.RECT, {
          'x': 0,
          'y': 0,
          'rx': Blockly.Bubble.BORDER_WIDTH,
          'ry': Blockly.Bubble.BORDER_WIDTH,
          'fill': 'black',
        }, mask);
    this.background_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.RECT, {
          'x': 0,
          'y': 0,
          'width': '100%',
          'height': '100%',
          'mask': 'url(#contentAreaHighlightMask' + rnd + ')',
        }, this.svgGroup_);

    this.applyColor();
    const metricsManager = this.workspace_.getMetricsManager();
    this.cachedContentMetrics_ = metricsManager.getContentMetrics(true);
    this.resize(this.cachedContentMetrics_);
    const absoluteMetrics = metricsManager.getAbsoluteMetrics();
    this.position(this.cachedContentMetrics_, absoluteMetrics);

    // Apply transition animation for opacity changes.
    this.svgGroup_.style.transition = 'opacity ' + ANIMATION_TIME + 's';

    const parentSvg = this.workspace_.getParentSvg();
    if (parentSvg.firstChild) {
      parentSvg.insertBefore(this.svgGroup_, parentSvg.firstChild);
    } else {
      parentSvg.appendChild(this.svgGroup_);
    }

    this.onChangeWrapper_ = this.onChange.bind(this);
    this.workspace_.addChangeListener(this.onChangeWrapper_);
  }

  /**
   * Disposes of content highlight.
   * Unlinks from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    if (this.svgGroup_) {
      Blockly.utils.dom.removeNode(this.svgGroup_);
    }
    if (this.onChangeWrapper_) {
      this.workspace_.removeChangeListener(this.onChangeWrapper_);
    }
  }

  /**
   * Handles events triggered on the workspace.
   * @param event The event.
   */
  private onChange(event: Blockly.Events.Abstract) {
    if (event.type === Blockly.Events.THEME_CHANGE) {
      this.applyColor();
    } else if (CONTENT_CHANGE_EVENTS_.indexOf(event.type) !== -1) {
      const metricsManager = this.workspace_.getMetricsManager();
      if (event.type !== Blockly.Events.VIEWPORT_CHANGE) {
        // The content metrics change when it's not a viewport change event.
        this.cachedContentMetrics_ = metricsManager.getContentMetrics(true);
        this.resize(this.cachedContentMetrics_);
      }
      const absoluteMetrics = metricsManager.getAbsoluteMetrics();
      this.position(this.cachedContentMetrics_, absoluteMetrics);
    } else if (event.type === Blockly.Events.BLOCK_DRAG) {
      this.handleBlockDrag(event as Blockly.Events.BlockDrag);
    } else if (event.type === Blockly.Events.BLOCK_CHANGE) {
      // Resizes the content highlight when it is a block change event
      const metricsManager = this.workspace_.getMetricsManager();
      this.cachedContentMetrics_ = metricsManager.getContentMetrics(true);
      this.resize(this.cachedContentMetrics_);
    }
  }

  /**
   * Changes opacity of the highlight based on what kind of block drag event
   * is passed.
   * @param event The BlockDrag event.
   */
  private handleBlockDrag(event: Blockly.Events.BlockDrag) {
    const opacity = event.isStart ? '0' : '1';
    this.svgGroup_.setAttribute('opacity', opacity);
  }

  /**
   * Applies the color fill for the highlight based on the current theme.
   */
  private applyColor() {
    const theme = this.workspace_.getTheme();
    const bgColor =
        theme.getComponentStyle('workspaceBackgroundColour') || '#ffffff';

    const colorDarkened =
        Blockly.utils.colour.blend('#000', bgColor, 0.1);
    const colorLightened =
        Blockly.utils.colour.blend('#fff', bgColor, 0.1);
    const color = (bgColor === '#ffffff' || bgColor === '#fff') ?
        colorDarkened : colorLightened;
    this.background_.setAttribute('fill', color);
  }

  /**
   * Resizes the content highlight.
   * @param contentMetrics The content metrics for the workspace in workspace coordinates.
   */
  private resize(contentMetrics: Blockly.MetricsManager.ContainerRegion) {
    const width = contentMetrics.width ? contentMetrics.width +
        2 * this.padding_ : 0;
    const height = contentMetrics.height ? contentMetrics.height +
        2 * this.padding_ : 0;
    if (width !== this.width_) {
      this.width_ = width;
      this.rect_.setAttribute('width', `${width}`);
    }
    if (height !== this.height_) {
      this.height_ = height;
      this.rect_.setAttribute('height', `${height}`);
    }
  }

  /**
   * Positions the highlight on the workspace based on the workspace metrics.
   * @param contentMetrics The content metrics for the workspace in workspace coordinates.
   * @param absoluteMetrics The absolute metrics for the workspace.
   */
  private position(contentMetrics: Blockly.MetricsManager.ContainerRegion, absoluteMetrics: Blockly.MetricsManager.AbsoluteMetrics) {
    // Compute top/left manually to avoid unnecessary extra computation.
    const viewTop = -this.workspace_.scrollY;
    const viewLeft = -this.workspace_.scrollX;
    const scale = this.workspace_.scale;
    const top = absoluteMetrics.top + contentMetrics.top * scale - viewTop -
        this.padding_ * scale;
    const left = absoluteMetrics.left + contentMetrics.left * scale - viewLeft -
        this.padding_ * scale;

    if (top !== this.top_ || left !== this.left_ ||
        this.lastScale_ !== scale) {
      this.top_ = top;
      this.left_ = left;
      this.lastScale_ = scale;
      this.rect_.setAttribute(
          'transform',
          'translate(' + left + ',' + top + ') scale(' + scale +')');
    }
  }
}

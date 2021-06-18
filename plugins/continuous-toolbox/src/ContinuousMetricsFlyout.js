/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */


import * as Blockly from 'blockly/core';

/** Adds additional padding to the bottom of the flyout if needed. */
export class ContinuousFlyoutMetrics extends Blockly.FlyoutMetricsManager {
  /** @override */
  constructor(workspace, flyout) {
    super(workspace, flyout);
  }
  /**
   * Adds additional padding to the bottom of the flyout if needed,
   * in order to make it possible to scroll to the top of the last category.
   * @override
   */
  getScrollMetrics(
      getWorkspaceCoordinates = undefined, viewMetricsParam = undefined, contentMetricsParam = undefined) {
    const scrollMetrics = super.getScrollMetrics(
        getWorkspaceCoordinates, viewMetricsParam, contentMetricsParam);
    const contentMetrics = contentMetricsParam ||
        this.getContentMetrics(getWorkspaceCoordinates);
    const viewMetrics = viewMetricsParam ||
        this.getViewMetrics(getWorkspaceCoordinates);

    if (scrollMetrics) {
      scrollMetrics.height +=
          this.flyout_.calculateBottomPadding(contentMetrics, viewMetrics);
    }
    return scrollMetrics;
  }
}

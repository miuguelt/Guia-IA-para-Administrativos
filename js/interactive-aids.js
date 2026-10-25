(function (root, factory) {
  'use strict';
  const commonJs = typeof module === 'object' && module.exports;
  const model = commonJs ? require('./interactive-aids-model.js') : root.CourseInteractiveAidsModel;
  const review = commonJs ? require('./interactive-aids-review.js') : root.CourseInteractiveAidsReview;
  const workflow = commonJs ? require('./interactive-aids-workflow.js') : root.CourseInteractiveAidsWorkflow;
  const aids = factory(model, review, workflow);
  if (commonJs) module.exports = aids;
  if (root) root.InteractiveAids = aids;
})(typeof window === 'undefined' ? globalThis : window, function (model, review, workflow) {
  'use strict';

  function init(doc = (typeof window === 'undefined' ? null : window.document)) {
    if (!doc) return false;
    review.initSafetyWidget(doc);
    review.initAuditWidget(doc);
    review.initPromptCompareWidget(doc);
    workflow.initAnonymizationWidget(doc);
    workflow.initPqrsEvaluatorWidget(doc);
    workflow.initDataCleanerWidget(doc);
    workflow.initProductivityRoiWidget(doc);
    return true;
  }

  return { ...model, init };
});

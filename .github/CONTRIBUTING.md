We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow.

## Repository Structure

There are three main sections:

**Codelabs** are interactive tutorials that are written in markdown syntax and published at [blocklycodelabs.dev](https://blocklycodelabs.dev). Codelabs mix natural language, code samples, and screenshots. The target user is following along and running the code as they read.

The codelabs directory has a [template](https://github.com/google/blockly-samples/blob/master/codelabs/template.md) and one folder per codelab. Each codelab's folder contains the codelab (as a markdown file), and all associated assets (pngs, gif, etc).

**Examples** are self-contained sample projects demonstrating techniques to include and extend the Blockly library. Examples contain mostly code and a demo web page. Example code should be extremely well-commented to make it easy to copy. The target user may be reading the code, running it locally, or copying code snippets.

The examples directory has one folder per example. Each example can be run with `npm install && npm run start`, and has a `README.md` file with additional context or instructions.

**Plugins** are self-contained pieces of code that add functionality to Blockly. Plugins can add fields, define themes, create renderers, and much more. The target user is a developer who finds and uses the plugin through npm. Plugins defined in this repository are *first-party* plugins, which means that they are supported by the Blockly team.

The plugins directory has one folder per plugin. To set up a new plugin based on one of the existing templates, use [@blockly/create-package](https://www.npmjs.com/package/@blockly/create-package).

## How can I contribute?

- [Suggest](https://github.com/google/blockly-samples/issues/new?assignees=&labels=type%3A+feature+request%2C+triage&template=feature_request.md) plugins, examples, or codelabs
- Implement plugins, examples, or codelabs
- [Report bugs](https://github.com/google/blockly-samples/issues/new?assignees=&labels=type%3A+bug%2C+triage&template=bug_report.md)
- Fix bugs
- Reproduce bugs

## How do I add a plugin?

Plugins go through four stages: suggestion, discussion, implementation, and publishing:

A plugin starts as a **suggestion**. You can suggest a plugin by creating a new issue with the [Feature Request](https://github.com/google/blockly-samples/issues/new?assignees=&labels=type%3A+feature+request%2C+triage&template=feature_request.md) template. To write a good suggestion:
- Describe the desired functionality.
- Describe the API the plugin would expose.
- List alternatives you've considered.
- List any APIs that need to be added or changed in core Blockly to support the plugin.
- Include screenshots, GIFs, or mock-ups if the plugin includes UI features.
- Explain why it should be a first-party plugin rather than a third-party plugin.

Before making a suggestion, [search](https://github.com/google/blockly-samples/issues?q=is%3Aopen+is%3Aissue+label%3A%22category%3A+plugin%22+label%3A%22type%3A+feature+request%22) for a related issue. If you find one, add a comment to the existing issue instead of opening a new one.

Next, a plugin will go into the **discussion** phase. This phase includes:
- Clarification of the desired functionality.
- Clarification of the plugin's API.
- Planning for implementation.
- Planning for tests.
- Discussion of API changes in core Blockly.
- Breaking large plugins into implementation steps.
- Plugin naming, based on naming conventions that we will publish Real Soon Now.

The goal is that at the end of the discussion phase all major design decisions have been made and there is a clear list of implementation steps. During discussion we may decide that a plugin should be a third-party plugin, and not be published under the `@blockly` scope. In that case we will close the issue.

Next is the **implementation** phase, which includes
- Running `npx @blockly/create-package` to set up the plugin and its directory from a template.
- Implementing core logic for the plugin.
- Implementing a UI, if needed.
- Testing the plugin, using mocha.
- Documenting the plugin, including the `README`.

Implentation may be done by multiple contributors in parallel. Anyone interested should comment on the issue and ask if it's still open for contributions. You may implement a plugin collaboratively on your own fork, or through pull requests against this repository. Plugins are not published while they are under initial construction.

Finally, **publishing**. This is done by Blockly team members when implementation is complete.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution;
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Community Guidelines

This project follows
[Google's Open Source Community Guidelines](https://opensource.google.com/conduct/).

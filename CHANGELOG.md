# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1]
### Added
- Dark mode for the widget. Possible to either initialize with dark mode or toggle. Add `.wl-dark` to the `.wl-pageInfoWidget` to toggle manually.
- Add ability to hide thumbs (hideThumb option)
- Add copyright notice
### Fixed
- Removed wrongfully attached -customlogo class when logo is Wikipedia
### Changed
- DEMOS: Wrap popovers with scoped div

## [0.2.0]
### Added
- Popup demo using bootstrap popover.

### Changed
- Completely change the popup design.

## [0.1.0]
### Added
- Allow for custom logo image and title for non-Wikipedia sources.
- Add a visual demo to display results for various common cases.
- Add a popup demo to demonstrate the popup implementation (that is used in the WordPress plugin)

### Changed
- Display 'Wikipedia' and 'MediaWiki' based on the content source
- Add faded text effect to the 'read more' portion of the display.
- Restyle content box. Display limited HTML from the API, remove height limitation, and return the 'read more' link.

## [0.0.2] - 2019-07-08
### Changed
- Hide thumbnail if it doesn't exist
- Change cache key to take 'lang' into account
- Fix demo assets location
- Switch Wikipedia logo from globe

## [0.0.1] - 2019-07-07
Working version.

[Unreleased]: https://github.com/mooeypoo/jquery.wikilookup/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/mooeypoo/jquery.wikilookup/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/mooeypoo/jquery.wikilookup/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mooeypoo/jquery.wikilookup/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/mooeypoo/jquery.wikilookup/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/mooeypoo/jquery.wikilookup/releases/tag/v0.0.1

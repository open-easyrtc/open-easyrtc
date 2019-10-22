The easyrtc.js file is built from the easyrtc_int.js file.

- Requires [__npm__](https://www.npmjs.com/get-npm) or [__yarn__](https://yarnpkg.com/lang/en/)

# Installing Dependencies
1. Ensure you are in the __top level__ open-easyrtc directory (i.e. `cd ..` if you are in this folder)

2. Install node dependencies
    - `npm i` __or__
    - `yarn`

3. Install grunt globally
    - `npm i -g grunt` __or__
    - `yarn global add grunt` (`yarn install --global grunt` for older yarn versions)


# Building `easyrtc.js`
- Run `grunt build_api` from the top level open-easyrtc directory


# Linting
- Run `grunt lint` to run both js and css linting.
- To run js or css linting individually, run `grunt jslint` or `grunt csslint`


# Testing

## Dependencies
0. Follow the __Installing Dependencies__ step above
1. Changing working directory to `/test/api/`
    - `cd test/api`

2. Install test dependencies
    - `npm i` __or__
    - `yarn`

## Running Tests
- Ensure you are in the top level open-easyrtc directory, and run `grunt test`

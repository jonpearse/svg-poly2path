/*********************************************************************************************************************
 *
 * Runner
 *
 *********************************************************************************************************************/

// include some CLI stuff
const cliParser = require('command-line-args');

// define options
const options = cliParser([
    { name: 'input',  alias: 'i' },
    { name: 'output', alias: 'o', defaultValue: null }
]);

// ensure we have an input
if (options.input === undefined)
{
    throw new Error('Missing argument <input>');
    process.exit();
}

require('./poly2path')(options.input, options.output);

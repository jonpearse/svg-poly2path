/*********************************************************************************************************************
 *
 * Converts POLYGON elements in an SVG to PATHs instead.
 *
 *********************************************************************************************************************/

const fs    = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * Converts a polygon point to a path element.
 *
 * @param   {Array} aPoint - the current point
 * @param   {Array} aLast  - the last point
 * @return  {String} an appropriate path command
 */
function point2pathCommand(aPoint, aLast = null)
{
    // 0. if we have no last, short-circuit
    if (aLast === null)
    {
        return `M${aPoint.join(',')}`;
    }

    // 1. if we’re on the same x-axis
    if (aPoint[0] === aLast[0])
    {
        return `V${aPoint[1]}`;
    }

    // 2. if we’re on the same y-axis
    if (aPoint[1] === aLast[1])
    {
        return 'H${aPoint[0]}';
    }

    return `L${aPoint.join(',')}`;
}

/**
 * Parses an individual POLYGON element
 *
 * @param {SVGElement} el - the element to parse
 */
function parsePoly(el)
{
    // 1. get us some points
    let sPoints = el.getAttribute('points');
    if ((sPoints === null) || (sPoints.trim() === ''))
    {
        return;
    }

    // 2. parse out
    let aLast = null;
    let sPath = sPoints.match(/(-?[\d.]+)(?:,|\s)(-?[\d.]+)/g).map(sM =>
    {
        let aC = sM.split(/(?:,|\s)/);
        let sNew = point2pathCommand(aC, aLast);
        aLast = aC;
        return sNew;

    }).join(' ') + ' Z';

    // 3. create the new node
    // a. create a PATH node + set it’s ‘d’
    let elPath = el.ownerDocument.createElement('path');
    elPath.setAttribute('d', sPath);

    // b. copy all attrs except 'points' across
    el.getAttributeNames().filter(sAttr => (sAttr.toLowerCase() !== 'points')).forEach(sAttr => elPath.setAttribute(sAttr, el.getAttribute(sAttr)));

    // c. dump it in
    el.parentNode.insertBefore(elPath, el);
    el.parentNode.removeChild(el);
}

/**
 * Performs the actual conversion.
 *
 * @param {String} sInFile - the input file
 * @param {String} sOutFile - the output file. Omit to overwrite the input
 * @return {Promise} a promise that is resolved on success, rejected otherwise
 */
function poly2path(sInFile, sOutFile = null)
{
    // 0. default + compare input + output stuff
    sOutFile = sOutFile || sInFile;

    sInFile  = fs.realpathSync(sInFile);
    sOutFile = fs.realpathSync(sOutFile);

    // 2. do everything else in the promise
    return new Promise((resolve, reject) =>
    {
        // a. check existence
        try
        {
            fs.statSync( sInFile );
        }
        catch (ex)
        {
            return reject(`Input file ${sInFile} doesn’t exist`);
        }

        // b. load the file in
        JSDOM.fromFile(sInFile, { contentType: 'image/svg+xml' }).then(dom =>
        {
            let elements = dom.window.document.getElementsByTagName('polygon');
            while (elements.length > 0)
            {
                parsePoly(elements[0]);
            }

            // save!
            fs.writeFile(sOutFile, dom.window.document.documentElement.outerHTML, err =>
            {
                if (err === null)
                {
                    resolve();
                }
                else
                {
                    reject(err);
                }
            });
        });
    });
}

// Export everything
module.exports = poly2path;

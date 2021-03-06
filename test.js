import fs from 'fs';
import postcss from 'postcss';
import test from 'ava';
import { diffLines } from 'diff';
import chalk from 'chalk';

import plugin from './';

function getDiff(left, right) {
    let msg = ['\n'];
    diffLines(left, right).forEach(item => {
        if (item.added || item.removed) {
            let text = item.value
                .replace('\n', '\u00b6\n')
                .replace('\ufeff', '[[BOM]]');
            msg.push(chalk[item.added ? 'green' : 'red'](text));
        } else {
            let value = item.value.replace('\ufeff', '[[BOM]]');
            let lines = value.split('\n');

            // max line count for each item
            let keepLines = 6;
            // lines to be omitted
            let omitLines = lines.length - keepLines;
            if (lines.length > keepLines) {
                lines.splice(
                    Math.floor(keepLines / 2),
                    omitLines,
                    chalk.gray('(...' + omitLines + ' lines omitted...)')
                );
            }
            msg.concat(lines);
        }
    });
    msg.push('\n');
    return msg.map(line => '  ' + line).join('');
}

function exec(t, input, output, opts = { }) {
    return postcss([ plugin(opts) ]).process(input)
        .then( result => {
            if (result.css !== output) {
                t.fail(getDiff(result.css, output));
            }
            t.deepEqual(result.warnings().length, 0);
        });
}

function read(file) {
    return fs.readFileSync(`./test/${file}.css`, { encoding: 'utf-8' });
}

function run(task, desc) {
    test(desc, t => {
        return exec(t, read(task), read(`${task}.post`));
    });
}

/* eslint-disable max-len */
run('keyframes', 'Overridden @keyframes should be discarded correctly.');
run('counter-style', 'Overridden @counter-style should be discarded correctly.');
/* eslint-enable max-len */

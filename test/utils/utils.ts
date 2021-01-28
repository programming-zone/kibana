/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * and the Server Side Public License, v 1; you may not use this file except in
 * compliance with, at your election, the Elastic License or the Server Side
 * Public License, v 1.
 */

import { writeFileSync } from 'fs';
import shell from 'shelljs';
import * as Either from '../../src/dev/code_coverage/ingest_coverage/either';

export const id = () => {};

interface FileWriteOption {
  flag: string;
  encoding: 'utf8';
}

export const mkDir = (x: string) => shell.mkdir('-p', x);

const encoding = 'utf8';

const writeUtf8: FileWriteOption = { flag: 'w', encoding };

const appendUtf8: FileWriteOption = { flag: 'a', encoding };

const writeOrAppend = (x: number) => (x === 0 ? Either.left(x) : Either.right(x));

export const flushSavedObjects = (dest: string) => (log: any) => (payload: any) => {
  const writeToFile = writeFileSync.bind(null, dest);

  [...payload].forEach((savedObj, i) => {
    const writeCleaned = writeToFile.bind(null, `${JSON.stringify(savedObj, null, 2)}\n\n`);

    writeOrAppend(i).fold(
      () => writeCleaned(writeUtf8),
      () => writeCleaned(appendUtf8)
    );
  });

  log.debug(`\n### Exported saved objects to destination: \n\t${dest}`);
};

const ndjsonToObj = (x: any) => x.split('\n').map((stanza: any) => JSON.parse(stanza));

const defaultTypes = ['index-pattern', 'search', 'visualization', 'dashboard'];

export const exportSavedObjects = (types = defaultTypes, excludeExportDetails = true) => async (
  log: any,
  supertest: any
) =>
  await supertest
    .post('/api/saved_objects/_export')
    .set('kbn-xsrf', 'anything')
    .send({
      type: types,
      excludeExportDetails,
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .then((resp: any) => ndjsonToObj(resp.text));

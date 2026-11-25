/**
 * Minimaler Backend-Mock für die Barrierefreiheitsprüfung.
 *
 * Die Fallnummer steuert die Antwort:
 *   ok              -> vollständige Daten (rot, gelb, grün)
 *   empty           -> keine Scoring-Ergebnisse
 *   slow            -> vollständige Daten mit 4 s Verzögerung (Ladezustand)
 *   meta-<status>   -> Patientendaten mit HTTP-Status, Ergebnisse ok
 *   alerts-<status> -> Ergebnisse mit HTTP-Status, Patientendaten ok
 */
/* global setTimeout, URL */
import http from 'node:http';

const HOUR = 3_600_000;

function series(analyteName, unit, values, scores, severity) {
  const now = Date.now();
  return values.map((value, i) => {
    const time = new Date(now - (values.length - 1 - i) * 12 * HOUR).toISOString();
    return {
      score: scores[i],
      severity: i === values.length - 1 ? severity : null,
      severityComment:
        i === values.length - 1
          ? `<p>Auffälliger Verlauf von <strong>${analyteName}</strong>. Bitte Befund prüfen.</p>`
          : null,
      analyteName,
      analyteValue: value,
      analyteValueUnit: unit,
      analyteMeasuringTime: time,
      resultCreationTime: time,
    };
  });
}

function alerts(caseId) {
  return {
    medicalCaseId: caseId,
    scoringSystems: [
      {
        scoringSystemName: 'AKI',
        scoringSystemVersion: '1.6',
        scores: series(
          'Kreatinin',
          'µmol/l',
          [72, 80, 150, 201, 218],
          ['green', 'green', 'red', 'red', 'red'],
          'AKIN-Stadium 1',
        ),
      },
      {
        scoringSystemName: 'Hypokaliämie',
        scoringSystemVersion: '1.0',
        scores: series('Kalium', 'mmol/l', [3.9, 3.4, 3.2], ['green', 'yellow', 'yellow'], null),
      },
      {
        scoringSystemName: 'Anämie',
        scoringSystemVersion: '1.0',
        scores: series('Hämoglobin', 'g/dl', [13.1, 13.4], ['green', 'green'], null),
      },
      {
        scoringSystemName: 'Sepsis',
        scoringSystemVersion: '1.0',
        scores: series('Procalcitonin', 'ng/ml', [0.1], ['green'], null),
      },
    ],
  };
}

function metadata(caseId) {
  return {
    id: 'P-123456',
    medicalCaseId: caseId,
    firstname: 'Erika',
    lastname: 'Mustermann',
    dateOfBirth: '1964-08-12T00:00:00Z',
    sex: 'female',
  };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function statusFor(caseId, kind) {
  const match = new RegExp(`^${kind}-(\\d{3})$`).exec(caseId);
  return match ? Number(match[1]) : null;
}

export function startMockBackend(port) {
  const server = http.createServer(async (req, res) => {
    const match = /^\/medicalcases\/([^/]+)\/(scores\/history|metainformation\/patient)$/.exec(
      new URL(req.url, 'http://localhost').pathname,
    );
    if (!match) return send(res, 404, { message: 'not found' });

    const caseId = decodeURIComponent(match[1]);
    const isAlerts = match[2] === 'scores/history';

    if (caseId === 'slow') await new Promise((resolve) => setTimeout(resolve, 4000));

    const failing = statusFor(caseId, isAlerts ? 'alerts' : 'meta');
    if (failing) {
      return send(res, failing, { message: `HTTP ${failing}` }, { 'retry-after': '300' });
    }

    if (isAlerts) {
      return send(
        res,
        200,
        caseId === 'empty' ? { medicalCaseId: caseId, scoringSystems: [] } : alerts(caseId),
      );
    }
    return send(res, 200, metadata(caseId));
  });

  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

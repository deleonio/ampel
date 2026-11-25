@import eu.ampel_platform.notification_service.notification.mail.laboratory_score.LaboratoryScoreMailModel
@param LaboratoryScoreMailModel model
AMPEL-Benachrichtigung (lokale Entwicklungsumgebung)

Fall:          ${model.getMedicalCaseId()}
Patient:       ${model.getPatientId()} ${model.getPatientLastname().orElse("")}, ${model.getPatientFirstname().orElse("")}
Score:         ${model.getAmpelScore()} (${model.getScoringSystemName()} ${model.getScoringSystemVersion()})
Darstellung:   ${model.getScoringSystemScoreRepresentation()}
Analyt:        ${model.getAnalyte()} = ${model.getAnalyteValue()} ${model.getAnalyteUnit()}
Gemessen:      ${String.valueOf(model.getAnalyteMeasuringTime())}
Berechnet:     ${String.valueOf(model.getScoreCalculationTime())}
Kommentar:     ${model.getScoringSystemComment()}

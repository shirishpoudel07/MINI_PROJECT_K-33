/**
 * Utilities for matching patients with their assigned attending doctors.
 */

export function isPatientAssignedToDoctor(patient, doctor) {
  if (!patient || !doctor) return false;

  // 1. Direct ID match if present
  if (patient.assignedDoctorId && doctor.id && patient.assignedDoctorId === doctor.id) {
    return true;
  }

  const pDoc = (patient.assignedDoctor || '').toLowerCase().trim();
  if (!pDoc) return false;

  const docName = (doctor.name || '').toLowerCase().trim();
  const docShort = (doctor.shortName || '').toLowerCase().trim();

  // 2. Direct string containment
  if (docShort && pDoc.includes(docShort)) return true;
  if (docName && pDoc.includes(docName)) return true;
  if (pDoc.includes(docShort) || pDoc.includes(docName)) return true;

  // 3. Match surname (e.g., "Vance", "Lin", "Miller")
  const cleanDoc = docShort.replace(/^dr\.?\s*/i, '').replace(/,/g, '').trim();
  const docTokens = cleanDoc.split(/\s+/).filter(t => t.length > 2);
  const surname = docTokens[docTokens.length - 1];

  if (surname && pDoc.includes(surname)) {
    return true;
  }

  return false;
}

export function getAssignedDoctorForPatient(patient, verifiedDoctors = []) {
  if (!patient || !Array.isArray(verifiedDoctors) || verifiedDoctors.length === 0) {
    return null;
  }
  return verifiedDoctors.find(doc => isPatientAssignedToDoctor(patient, doc)) || null;
}


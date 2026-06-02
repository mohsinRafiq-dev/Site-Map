import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

const projectsRef = (uid) =>
  collection(db, "users", uid, "projects");

// Save or update a project.
// Pass `id` to update an existing doc; omit it to create a new one.
// Returns the project ID.
export async function saveProject(uid, data, id = null) {
  // Firestore rejects `undefined` values — sanitise first.
  const payload = JSON.parse(
    JSON.stringify(data, (_, v) => (v === undefined ? null : v))
  );
  payload.updatedAt = serverTimestamp();

  if (id) {
    await setDoc(doc(db, "users", uid, "projects", id), payload, { merge: true });
    return id;
  }
  payload.createdAt = serverTimestamp();
  const ref = await addDoc(projectsRef(uid), payload);
  return ref.id;
}

// Fetch all projects for a user, newest first.
export async function loadProjects(uid) {
  const q = query(projectsRef(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Permanently delete a project.
export async function deleteProject(uid, id) {
  await deleteDoc(doc(db, "users", uid, "projects", id));
}

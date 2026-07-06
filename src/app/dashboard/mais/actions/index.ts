export {
  getInstructors,
  saveInstructor,
  deleteInstructor,
} from "./instructors";
export type { Instructor } from "./instructors";

export {
  getImages,
  addSchoolImage,
  deleteImage,
} from "./images";
export type { SchoolImage } from "./images";

export {
  getSchoolSettings,
  saveSchoolSettings,
  saveSchoolInfo,
  saveSchoolLogo,
} from "./settings";
export type { SchoolSettings } from "./settings";

export {
  getWaiverVersions,
  getWaiverAcceptances,
  saveWaiverVersion,
} from "./waivers";
export type { WaiverVersion, WaiverAcceptanceRow } from "./waivers";

export {
  saveProfile,
} from "./profile";

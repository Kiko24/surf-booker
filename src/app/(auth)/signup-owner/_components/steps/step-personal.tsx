"use client";

import { StepPersonal as SharedStepPersonal } from "@/components/auth/step-personal";
import { signupOwner } from "../../actions";

type Props = {
  email: string;
  onSuccess: () => void;
  onEmailConflict: () => void;
};

export function StepPersonal(props: Props) {
  return <SharedStepPersonal {...props} signupAction={signupOwner} />;
}

import type { JobStatus, OfferStatus } from "@/lib/types";

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransitionError";
  }
}

const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  open: ["receiving_offers", "closed", "removed"],
  receiving_offers: ["closed", "removed"],
  closed: [],
  removed: [],
};

const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  submitted: ["accepted", "declined", "withdrawn"],
  accepted: [],
  declined: [],
  withdrawn: [],
};

export function canTransitionJob(from: JobStatus, to: JobStatus) {
  return JOB_TRANSITIONS[from].includes(to);
}

export function assertJobTransition(from: JobStatus, to: JobStatus) {
  if (!canTransitionJob(from, to)) {
    throw new TransitionError(`A job cannot move from ${from} to ${to}.`);
  }
}

export function canTransitionOffer(from: OfferStatus, to: OfferStatus) {
  return OFFER_TRANSITIONS[from].includes(to);
}

export function assertOfferTransition(from: OfferStatus, to: OfferStatus) {
  if (!canTransitionOffer(from, to)) {
    throw new TransitionError(`An offer cannot move from ${from} to ${to}.`);
  }
}

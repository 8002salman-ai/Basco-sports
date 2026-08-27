export type BusinessConfig = {
  legalBusinessName: string | null;
  tradingName: string;
  companyNumber: string | null;
  registeredJurisdiction: string | null;
  businessAddress: string | null;
  returnAddress: string | null;
  supportEmail: string | null;
  privacyEmail: string | null;
  supportPhone: string | null;
  vatNumber: string | null;
  euResponsiblePerson: {
    name: string | null;
    postalAddress: string | null;
    email: string | null;
  };
};

/**
 * Public business details. Fields below were provided by the owner on 2026-08-27;
 * anything still null is a confirmed LAUNCH_BLOCKER and must not be guessed.
 * The Irving TX address is recorded as provided but is NOT a complete verified
 * street address yet – treat as pending confirmation for legal/customs use.
 */
export const business: BusinessConfig = {
  legalBusinessName: null, // registered legal entity name still required from owner
  tradingName: "Basco Sports",
  companyNumber: null,
  registeredJurisdiction: "Texas, USA (entity registration to be confirmed)",
  businessAddress: "Dallas Court Yard, Irving, Texas, USA (full street address to be confirmed by owner)",
  returnAddress: null, // return address still required from owner
  supportEmail: "basco.pk@gmail.com",
  privacyEmail: "basco.pk@gmail.com",
  supportPhone: "+1 (440) 941-8002",
  vatNumber: null,
  euResponsiblePerson: {
    name: null,
    postalAddress: null,
    email: null,
  },
};

export const hasVerifiedBusinessIdentity = Boolean(
  business.legalBusinessName && business.businessAddress && business.supportEmail,
);

export const launchBlockers = [
  !hasVerifiedBusinessIdentity && "LAUNCH_BLOCKER: verified legal business identity, address, and support email are missing",
  !business.returnAddress && "LAUNCH_BLOCKER: verified return address is missing",
  !business.euResponsiblePerson.name && "LAUNCH_BLOCKER: EU Responsible Person details are missing for EU listings",
].filter(Boolean) as string[];

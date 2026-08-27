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
 * Public business details are intentionally null until the owner verifies them.
 * Never replace these nulls with guessed or demo identity data.
 */
export const business: BusinessConfig = {
  legalBusinessName: null,
  tradingName: "Basco Sports",
  companyNumber: null,
  registeredJurisdiction: null,
  businessAddress: null,
  returnAddress: null,
  supportEmail: null,
  privacyEmail: null,
  supportPhone: null,
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

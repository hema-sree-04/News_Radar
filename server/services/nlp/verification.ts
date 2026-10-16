// Verification Engine: Determines and updates verification status across clusters

export type VerificationStatus = 'VERIFIED' | 'CORROBORATED' | 'REPORTED' | 'UNVERIFIED SIGNAL' | 'DISPUTED';

export interface VerificationEvaluation {
  status: VerificationStatus;
  primarySourceUrl?: string;
  primarySourceName?: string;
  hasTier1: boolean;
  hasTier2: boolean;
  hasTier3: boolean;
  hasTier4: boolean;
  explanation: string;
}

export function evaluateVerificationStatus(articles: {
  sourceTier: number;
  sourceName: string;
  url: string;
}[]): VerificationEvaluation {
  if (!articles || articles.length === 0) {
    return {
      status: 'UNVERIFIED SIGNAL',
      hasTier1: false,
      hasTier2: false,
      hasTier3: false,
      hasTier4: false,
      explanation: 'No sources available.'
    };
  }

  const tier1Articles = articles.filter(a => a.sourceTier === 1);
  const tier2Articles = articles.filter(a => a.sourceTier === 2);
  const tier3Articles = articles.filter(a => a.sourceTier === 3);
  const tier4Articles = articles.filter(a => a.sourceTier === 4);

  const hasTier1 = tier1Articles.length > 0;
  const hasTier2 = tier2Articles.length > 0;
  const hasTier3 = tier3Articles.length > 0;
  const hasTier4 = tier4Articles.length > 0;

  // Primary source determination
  let primarySourceUrl: string | undefined;
  let primarySourceName: string | undefined;

  if (hasTier1) {
    primarySourceUrl = tier1Articles[0].url;
    primarySourceName = tier1Articles[0].sourceName;
  } else if (hasTier2) {
    primarySourceUrl = tier2Articles[0].url;
    primarySourceName = tier2Articles[0].sourceName;
  } else if (hasTier3) {
    primarySourceUrl = tier3Articles[0].url;
    primarySourceName = tier3Articles[0].sourceName;
  } else if (articles[0]) {
    primarySourceUrl = articles[0].url;
    primarySourceName = articles[0].sourceName;
  }

  let status: VerificationStatus = 'REPORTED';
  let explanation = '';

  if (hasTier1 && (hasTier2 || hasTier3 || tier1Articles.length > 1)) {
    status = 'CORROBORATED';
    explanation = `Direct primary confirmation from ${primarySourceName} with independent coverage across ${articles.length} sources.`;
  } else if (hasTier1) {
    status = 'VERIFIED';
    explanation = `Official announcement/paper published directly by ${primarySourceName}.`;
  } else if (hasTier2 && (articles.length >= 2 || hasTier3)) {
    status = 'CORROBORATED';
    explanation = `Multiple reputable technology journalism reports corroborating the development.`;
  } else if (hasTier2 || hasTier3) {
    status = 'REPORTED';
    explanation = `Reported by reputable secondary tech journalism (${primarySourceName}). Primary source awaiting direct confirmation.`;
  } else {
    status = 'UNVERIFIED SIGNAL';
    explanation = `Early community or video signal. Not yet independently confirmed by Tier 1/2 sources.`;
  }

  return {
    status,
    primarySourceUrl,
    primarySourceName,
    hasTier1,
    hasTier2,
    hasTier3,
    hasTier4,
    explanation
  };
}

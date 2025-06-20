// This file is intentionally modified to remove the chat feature.
// The AiMentor component now renders nothing.
// You can delete this file from your project if the AiMentor component is no longer used elsewhere.

import * as React from 'react';

// Minimal props interface, though it won't be used if the component returns null.
// Kept for consistency if other parts of the system still expect an AiMentor export.
interface AiMentorProps {
  defaultCodingLanguage?: string;
}

export function AiMentor({ defaultCodingLanguage }: AiMentorProps) {
  // The component now returns null, effectively removing all its UI,
  // including the Card element for the chat interface.
  return null;
}

/**
 * Retro UI Components - Centralized Exports
 *
 * All retro/pixel-style components used throughout the application
 * follow the design specification:
 * - Sharp square corners (no border-radius)
 * - Thick black borders (2px-4px)
 * - Hard drop shadows (4px 4px 0px 0px rgba(0,0,0,1))
 * - Monospace typography (Fira Code, JetBrains Mono)
 * - Blocky, stepped animations (no smooth transitions)
 * - 8-bit color palette
 */

// Buttons & Actions
export { RetroButton, type RetroButtonProps, retroButtonVariants } from './RetroButton';

// Containers & Layout
export { RetroCard } from './RetroCard';
export { RetroModal, RetroModalTrigger, RetroModalClose, RetroModalContent, RetroModalHeader, RetroModalFooter, RetroModalTitle, RetroModalDescription } from './RetroModal';
export { RetroAlert } from './RetroAlert';

// Form Elements
export { RetroCheckbox, type RetroCheckboxProps } from './RetroCheckbox';
export { RetroInput, type RetroInputProps } from './RetroInput';
export { RetroSelect, type RetroSelectProps } from './RetroSelect';
export { RetroLabel, type RetroLabelProps, retroLabelVariants } from './RetroLabel';

// Data Display
export { RetroBadge } from './RetroBadge';
export { RetroProgressBar } from './RetroProgressBar';

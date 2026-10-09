import { motion } from 'framer-motion';

/**
 * Renders the generated simulation in a sandboxed iframe (spec §22, §25).
 * The generated code is untrusted: sandbox="allow-scripts" with NO
 * allow-same-origin, so it cannot reach the parent app, cookies, or storage.
 * We never use dangerouslySetInnerHTML.
 */
export function SimulationViewer({ url }: { url: string }) {
  return (
    <motion.iframe
      key={url}
      title="Interactive Learning Simulation"
      src={url}
      sandbox="allow-scripts"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full w-full rounded-xl border border-slate-700 bg-white"
    />
  );
}

type QueryClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

/**
 * Enforces the only-one-highlighted invariant on monthly_packages:
 * the target row becomes highlighted, every other row is un-highlighted.
 * No DB constraint backs this — this function is the sole enforcer.
 *
 * Sequential (unset-all then set-target); a brief zero-highlighted
 * window is acceptable and preferable to a two-highlighted state.
 *
 * Supabase client is injected so a fake client can be passed in tests.
 */
export async function highlightPackage({
  supabase,
  id,
}: {
  supabase: QueryClient
  id: string
}): Promise<void> {
  const { error: unsetError } = await supabase
    .from('monthly_packages')
    .update({ highlighted: false })
    .neq('id', id)
  if (unsetError) throw unsetError

  const { error: setError } = await supabase
    .from('monthly_packages')
    .update({ highlighted: true })
    .eq('id', id)
  if (setError) throw setError
}

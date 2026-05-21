import { createClient } from '@/lib/supabase/server'
import type { MonthlyPackage } from '@/lib/types'

export type PackageInput = {
  name: string
  sessions: number
  price: number
  features: string[]
}

export const monthlyPackagesRepo = {
  async list(): Promise<MonthlyPackage[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('monthly_packages')
      .select('*')
      .order('price')
    if (error) throw error
    return (data ?? []) as MonthlyPackage[]
  },

  async create(input: PackageInput): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('monthly_packages').insert({
      name: input.name,
      sessions: input.sessions,
      price: input.price,
      features: input.features,
      highlighted: false,
    })
    if (error) throw error
  },

  async update(id: string, input: PackageInput): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('monthly_packages')
      .update({
        name: input.name,
        sessions: input.sessions,
        price: input.price,
        features: input.features,
      })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('monthly_packages')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async setHighlighted(id: string): Promise<void> {
    const supabase = await createClient()
    // Unset all others first (brief zero-highlighted window acceptable)
    const { error: e1 } = await supabase
      .from('monthly_packages')
      .update({ highlighted: false })
      .neq('id', id)
    if (e1) throw e1
    const { error: e2 } = await supabase
      .from('monthly_packages')
      .update({ highlighted: true })
      .eq('id', id)
    if (e2) throw e2
  },
}

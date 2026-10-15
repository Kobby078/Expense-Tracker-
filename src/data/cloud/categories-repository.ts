import { mapCloudError, type CategoryRow, type CloudResult } from '@/data/cloud/types';
import { formatCategoryName } from '@/utils/category-name';
import { supabase } from '@/lib/supabase';

export type CloudCategory = {
  id: string;
  name: string;
};

async function requireUserId(): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { userId: null, error: mapCloudError(error.message) };
  }

  if (!data.user) {
    return { userId: null, error: 'You must be signed in.' };
  }

  return { userId: data.user.id, error: null };
}

function toCloudCategory(row: CategoryRow): CloudCategory {
  return {
    id: row.id,
    name: row.name,
  };
}

export async function fetchCloudCategories(): Promise<CloudResult<CloudCategory[]>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: (data ?? []).map(toCloudCategory), error: null };
}

export async function addCloudCategory(name: string): Promise<CloudResult<CloudCategory>> {
  const { userId, error: authError } = await requireUserId();

  if (authError || !userId) {
    return { data: null, error: authError };
  }

  const formatted = formatCategoryName(name);

  if (formatted.length === 0) {
    return { data: null, error: 'Enter a category name.' };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: formatted,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: toCloudCategory(data), error: null };
}

/**
 * Renames a category and matching expense category strings in one database RPC.
 */
export async function renameCloudCategory(
  categoryId: string,
  newName: string
): Promise<CloudResult<CloudCategory>> {
  const { error: authError } = await requireUserId();

  if (authError) {
    return { data: null, error: authError };
  }

  const formatted = formatCategoryName(newName);

  if (formatted.length === 0) {
    return { data: null, error: 'Enter a category name.' };
  }

  const { data, error } = await supabase.rpc('rename_user_category', {
    p_category_id: categoryId,
    p_new_name: formatted,
  });

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: toCloudCategory(data), error: null };
}

/**
 * Deletes a category only when no expenses use that logical category.
 * Blocking is enforced in the database function.
 */
export async function deleteCloudCategory(categoryId: string): Promise<CloudResult<true>> {
  const { error: authError } = await requireUserId();

  if (authError) {
    return { data: null, error: authError };
  }

  const { error } = await supabase.rpc('delete_user_category', {
    p_category_id: categoryId,
  });

  if (error) {
    return { data: null, error: mapCloudError(error.message) };
  }

  return { data: true, error: null };
}

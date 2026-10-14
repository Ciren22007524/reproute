import raw from '../../data/equipment-catalog.json';
import type { Equipment, EquipmentCategory } from '@/types/domain';

export const categories = raw.categories as EquipmentCategory[];
export const equipment = raw.equipment as Equipment[];

export const equipmentById = new Map(equipment.map((e) => [e.id, e]));

/**
 * Sihirbazın adım kuralı. Saf fonksiyon: bileşen yalnızca okur, birim test
 * yalnızca bunu ölçer.
 *
 * Hizmet adımı **seçimle değil tamamlanmayla** kapanır (`servicesDone`):
 * kapanış ilk dokunuşa bağlansaydı ikinci hizmet hiç eklenemezdi. Tek
 * hizmetli salonda ilk dokunuş yeter (başka seçecek bir şey yok); birden çok
 * hizmette ziyaretçi "Devam" der.
 */
export type WizardStep = 1 | 2 | 3;

export function wizardStep({ serviceIds, servicesDone, barberId }: { serviceIds: string[]; servicesDone: boolean; barberId: string | null }): WizardStep {
  if (serviceIds.length === 0 || !servicesDone) return 1;
  return barberId ? 3 : 2;
}

/** Hizmet listesi değiştikten sonra adımın kendiliğinden kapanıp kapanmayacağı. */
export function servicesDoneAfterChange(serviceCount: number, selectedIds: string[]): boolean {
  return serviceCount === 1 && selectedIds.length > 0;
}

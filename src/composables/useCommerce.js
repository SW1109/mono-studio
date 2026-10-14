import { shallowRef, onMounted, onScopeDispose } from "vue";
import { serviceOffers } from "../../shared/commerce.js";

import { orderCenter } from "../config/orderCenter.js";
import { commerceRequest } from "../api/commerce.js";

export function useCommerceCatalog() {
  const catalog = shallowRef({ offers: serviceOffers, paymentsEnabled: false, environment: null, merchantName: "" });
  const loading = shallowRef(true);
  const error = shallowRef("");
  let controller;
  async function load() {
    if (orderCenter) { loading.value = false; error.value = ""; return; }
    controller?.abort();
    controller = new AbortController();
    const current = controller;
    loading.value = true;
    error.value = "";
    try { catalog.value = await commerceRequest("/catalog", { signal: current.signal }); }
    catch (failure) { if (!current.signal.aborted) error.value = failure.message; }
    finally { if (!current.signal.aborted) loading.value = false; }
  }
  onMounted(load);
  onScopeDispose(() => controller?.abort());
  return { catalog, loading, error, reload: load };
}


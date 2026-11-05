export const DECEASED_NAME_SQL = `CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, ''))`;

/** The Financials tab (`?tab=`) that lists a case, by its `dr.plantype`. */
export const FINANCIALS_TAB_SQL = `CASE dr.plantype WHEN 'LGU' THEN 'lgu' WHEN 'Life' THEN 'lifeplan' ELSE 'direct' END`;

export const formatPeso = (amount: number) =>
  `PHP ${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Links to a Financials tab with its table already searched for `search`
 * (e.g. the deceased's name), so the notification opens on the right row.
 */
export const financialsLink = (tab: string, search?: string) =>
  `/dashboard/financials?tab=${tab}${search ? `&search=${encodeURIComponent(search)}` : ''}`;

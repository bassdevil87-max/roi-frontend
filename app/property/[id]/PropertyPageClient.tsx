"use client";

import { useMemo } from "react";
import { PropertyHero } from "@/components/property/PropertyHero";
import { MonthlyProfitCard } from "@/components/property/MonthlyProfitCard";
import { WhereMoneyGoes } from "@/components/property/WhereMoneyGoes";
import { VacancyCard } from "@/components/property/VacancyCard";
import { DemandAnchors } from "@/components/property/DemandAnchors";
import { GrowthOutlook } from "@/components/property/GrowthOutlook";
import { TenantStatus } from "@/components/property/TenantStatus";
import { Section8Card } from "@/components/property/Section8Card";
import { RisksSection } from "@/components/property/RisksSection";
import { ClimateRiskCard } from "@/components/property/ClimateRiskCard";
import { GroundTruthCard } from "@/components/property/GroundTruthCard";
import { DataProvenanceCard } from "@/components/property/DataProvenanceCard";
import { DataQualityCard } from "@/components/property/DataQualityCard";
import { PropertyCTA } from "@/components/property/PropertyCTA";
import { PropertySectionNav, type SectionDef } from "@/components/property/PropertySectionNav";
import { SharedContextBanner } from "@/components/property/SharedContextBanner";
import { ExpertModeToggle } from "@/components/ui/ExpertModeToggle";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { useExpertMode } from "@/context/ExpertMode";
import { calculateProfitConfidence } from "@/lib/confidence";
import type { FeedProperty } from "@/types/roi";

interface PropertyPageClientProps {
  property: FeedProperty;
}

export function PropertyPageClient({ property }: PropertyPageClientProps) {
  const { expertMode } = useExpertMode();
  const confidence = useMemo(() => calculateProfitConfidence(property), [property]);

  const {
    address, listing, financials, vacancy, section8,
    demand_anchors, tenant_in_place, risks, hero_image,
    projection_3y, growth_reasons, climate_risk, ground_truth,
  } = property;

  const lev = financials.leveraged!;
  const cash = financials.cash!;
  const subtitle = `${listing.bedrooms} bed · ${listing.bathrooms} bath · ${listing.sqft?.toLocaleString() ?? "—"} sqft`;
  const fullAddress = `${address.street}, ${address.city}`;

  // Define sections that match the rendered cards — nav auto-hides conditional ones
  const sections: SectionDef[] = [
    { id: "sec-profit", label: "Profit" },
    { id: "sec-money", label: "Money" },
    { id: "sec-tenant", label: "Tenant", show: !!tenant_in_place },
    { id: "sec-section8", label: "Section 8", show: section8.flag_triggered },
    { id: "sec-vacancy", label: "Vacancy" },
    { id: "sec-gt", label: "Ground Truth" },
    { id: "sec-climate", label: "Climate" },
    { id: "sec-anchors", label: "Demand" },
    { id: "sec-growth", label: "Growth", show: !!projection_3y && !!growth_reasons },
    { id: "sec-risks", label: "Risks", show: !!risks && risks.length > 0 },
    { id: "sec-sources", label: "Sources" },
  ];

  return (
    <>
      <PropertyHero
        image={hero_image || ""}
        address={fullAddress}
        subtitle={subtitle}
        price={listing.price}
        propertyId={listing.external_id}
      />

      {/* Sticky jump-nav */}
      <PropertySectionNav sections={sections} />

      <div className="px-5 pt-3 pb-2 space-y-3 bg-paper-soft">
        {/* Shared link context (only renders if user arrived via /p/:id) */}
        <SharedContextBanner />

        {/* Demo banner + expert toggle on same row */}
        <div className="flex items-center gap-2">
          <DemoBanner className="flex-1" />
          <ExpertModeToggle />
        </div>

        <section id="sec-profit" className="scroll-mt-20">
          <MonthlyProfitCard
            leveraged={lev}
            cash={cash}
            vacancyRatePct={(vacancy.zip_rate ?? 0.021) * 100}
            confidence={confidence}
          />
          {/* Data Quality card — only in expert mode, pinned to the profit section */}
          {expertMode && (
            <div className="mt-3">
              <DataQualityCard confidence={confidence} />
            </div>
          )}
        </section>

        <section id="sec-money" className="scroll-mt-20">
          <WhereMoneyGoes
            cashFlow={lev}
            isLeveraged={true}
            rentSources={property.rent_estimate.units[0]?.sources_breakdown}
            rentConfidenceTier={confidence.rent.tier}
            rentConfidenceExplanation={confidence.rent.explanation}
          />
        </section>

        {tenant_in_place && (
          <section id="sec-tenant" className="scroll-mt-20">
            <TenantStatus
              rentMonthly={tenant_in_place.rent_monthly}
              leaseActiveUntil={tenant_in_place.lease_active_until}
            />
          </section>
        )}

        {section8.flag_triggered && section8.fmr_for_unit_size && (
          <section id="sec-section8" className="scroll-mt-20">
            <Section8Card
              fmrMonthly={section8.fmr_for_unit_size}
              marketRentMonthly={property.rent_estimate.mid}
              premiumMonthly={section8.premium_over_market ?? 0}
              waitlistLength={section8.voucher_waitlist_length ?? 0}
            />
          </section>
        )}

        <section id="sec-vacancy" className="scroll-mt-20">
          <VacancyCard
            thisProperty={vacancy.zip_rate ?? 0.021}
            stateName={address.state}
            stateAverage={vacancy.state_avg ?? 0.058}
            usAverage={vacancy.us_avg ?? 0.066}
          />
        </section>

        <section id="sec-gt" className="scroll-mt-20">
          <GroundTruthCard score={ground_truth} />
        </section>

        <section id="sec-climate" className="scroll-mt-20">
          <ClimateRiskCard climate={climate_risk} />
        </section>

        <section id="sec-anchors" className="scroll-mt-20">
          <DemandAnchors anchors={demand_anchors} />
        </section>

        {projection_3y && growth_reasons && (
          <section id="sec-growth" className="scroll-mt-20">
            <GrowthOutlook
              currentValue={listing.price}
              projectedValue={projection_3y}
              horizonYears={3}
              reasons={growth_reasons}
            />
          </section>
        )}

        {risks && risks.length > 0 && (
          <section id="sec-risks" className="scroll-mt-20">
            <RisksSection risks={risks} />
          </section>
        )}

        <section id="sec-sources" className="scroll-mt-20">
          <DataProvenanceCard property={property} />
        </section>
      </div>

      <PropertyCTA
        monthlyProfit={lev.monthly_cash_flow}
        returnPct={lev.cash_on_cash_return_pct ?? 0}
        tenantStatus="ready"
        propertyAddress={`${address.street}, ${address.city}, ${address.state}`}
        propertyId={listing.external_id}
      />

      {/* Feedback widget — positioned above the sticky CTA */}
      <FeedbackWidget
        context={`property:${listing.external_id}`}
        bottomOffset={118}
      />
    </>
  );
}

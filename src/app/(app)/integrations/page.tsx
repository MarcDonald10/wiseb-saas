"use client";

import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import { TODAY, date, pct } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { CleApi, Webhook } from "@/lib/types";
import { Tableau, type Colonne } from "@/components/tableau";
import { Badge, Bouton, Carte, EnTete, FormulaireModale, Onglets, cn } from "@/components/ui";

type Onglet = "connecteurs" | "webhooks" | "regles" | "cles";
const EVENEMENTS = ["facture.validee", "paiement.recu", "stock.sous_seuil", "commande.recue", "transfert.recu", "conge.approuve"];

function Interrupteur({ actif, libelle, onChange }: { actif: boolean; libelle: string; onChange: () => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={actif} aria-label={libelle} onClick={onChange}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", actif ? "bg-brand-600" : "bg-slate-300")}
    >
      <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", actif && "translate-x-5")} />
    </button>
  );
}

export default function Integrations() {
  const { data, maj, toast } = useApp();
  const [onglet, setOnglet] = useState<Onglet>("connecteurs");
  const [form, setForm] = useState<"webhook" | "cle" | null>(null);

  const colWebhooks: Colonne<Webhook>[] = [
    { id: "url", titre: "Adresse", cellule: (w) => <span className="break-all font-mono text-xs text-slate-900">{w.url}</span>, valeur: (w) => w.url },
    { id: "evenement", titre: "Événement", cellule: (w) => <Badge ton="bleu">{w.evenement}</Badge>, valeur: (w) => w.evenement },
    { id: "derniere", titre: "Dernière livraison", cellule: (w) => w.derniereLivraison, valeur: (w) => w.derniereLivraison, secondaire: true },
    { id: "succes", titre: "Réussite", cellule: (w) => pct(w.succes), valeur: (w) => w.succes, droite: true, secondaire: true },
    {
      id: "actif", titre: "Actif", droite: true,
      cellule: (w) => (
        <Interrupteur actif={w.actif} libelle={`Activer le webhook ${w.evenement}`} onChange={() => {
          maj((d) => ({ ...d, webhooks: d.webhooks.map((x) => (x.id === w.id ? { ...x, actif: !x.actif } : x)) }));
          toast(w.actif ? "Webhook désactivé." : "Webhook activé.");
        }} />
      ),
    },
  ];

  const colCles: Colonne<CleApi>[] = [
    { id: "nom", titre: "Application", cellule: (k) => <span className="whitespace-nowrap font-medium text-slate-900">{k.nom}</span>, valeur: (k) => k.nom },
    { id: "cle", titre: "Clé", cellule: (k) => <span className="font-mono text-xs">{k.prefixe}••••••••</span>, valeur: (k) => k.prefixe },
    { id: "perimetre", titre: "Périmètre", cellule: (k) => k.perimetre, valeur: (k) => k.perimetre, secondaire: true },
    { id: "cree", titre: "Créée le", cellule: (k) => date(k.creeLe), valeur: (k) => k.creeLe, secondaire: true },
    { id: "usage", titre: "Dernier usage", cellule: (k) => k.dernierUsage, valeur: (k) => k.dernierUsage, secondaire: true },
    {
      id: "actions", titre: "", droite: true,
      cellule: (k) => (
        <Bouton variante="danger" taille="sm" onClick={() => {
          if (!window.confirm(`Révoquer la clé « ${k.nom} » ? Les applications qui l'utilisent cesseront de fonctionner.`)) return;
          maj((d) => ({ ...d, clesApi: d.clesApi.filter((x) => x.id !== k.id) }));
          toast(`Clé « ${k.nom} » révoquée.`);
        }}>Révoquer</Bouton>
      ),
    },
  ];

  return (
    <>
      <EnTete
        titre="Intégrations"
        description="Connecteurs, webhooks, règles d'automatisation et clés d'API."
        action={
          onglet === "webhooks" ? <Bouton icone={Plus} onClick={() => setForm("webhook")}>Ajouter un webhook</Bouton>
          : onglet === "cles" ? <Bouton icone={Plus} onClick={() => setForm("cle")}>Créer une clé</Bouton>
          : undefined
        }
      />

      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        onglets={[
          { id: "connecteurs", libelle: "Connecteurs", compte: data.connecteurs.filter((c) => c.actif).length },
          { id: "webhooks", libelle: "Webhooks", compte: data.webhooks.length },
          { id: "regles", libelle: "Règles", compte: data.regles.filter((r) => r.actif).length },
          { id: "cles", libelle: "Clés d'API", compte: data.clesApi.length },
        ]}
      />

      {onglet === "connecteurs" && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.connecteurs.map((c) => (
            <li key={c.id}>
              <Carte className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-slate-900">{c.nom}</h2>
                  {c.mvp ? (
                    <Interrupteur actif={c.actif} libelle={`Activer ${c.nom}`} onChange={() => {
                      maj((d) => ({ ...d, connecteurs: d.connecteurs.map((x) => (x.id === c.id ? { ...x, actif: !x.actif } : x)) }));
                      toast(`${c.nom} ${c.actif ? "désactivé" : "activé"}.`);
                    }} />
                  ) : (
                    <Badge>Après le MVP</Badge>
                  )}
                </div>
                <p className="mt-2 flex-1 text-sm text-slate-500">{c.description}</p>
                {c.mvp && <p className="mt-3 text-xs font-medium text-slate-600">{c.actif ? "Connecté" : "Déconnecté"}</p>}
              </Carte>
            </li>
          ))}
        </ul>
      )}

      {onglet === "webhooks" && (
        <Tableau lignes={data.webhooks} colonnes={colWebhooks} cle={(w) => w.id}
          vide={{ titre: "Aucun webhook", texte: "Un webhook prévient votre système dès qu'un événement survient dans WISED.", action: <Bouton icone={Plus} onClick={() => setForm("webhook")}>Ajouter un webhook</Bouton> }} />
      )}

      {onglet === "regles" && (
        <ul className="space-y-3">
          {data.regles.map((r) => (
            <li key={r.id}>
              <Carte className="flex flex-wrap items-center gap-4 p-5">
                <span className="rounded-lg bg-brand-50 p-2 text-brand-600"><Zap className="h-4 w-4" aria-hidden /></span>
                <div className="min-w-0 flex-1 basis-60">
                  <h2 className="font-semibold text-slate-900">{r.nom}</h2>
                  <p className="mt-1 text-sm text-slate-600"><span className="font-medium text-slate-900">Quand</span> {r.quand.toLowerCase()}, <span className="font-medium text-slate-900">alors</span> {r.alors.toLowerCase()}.</p>
                </div>
                <p className="text-sm tabular-nums text-slate-500">{r.executions} exécutions</p>
                <Interrupteur actif={r.actif} libelle={`Activer la règle ${r.nom}`} onChange={() => {
                  maj((d) => ({ ...d, regles: d.regles.map((x) => (x.id === r.id ? { ...x, actif: !x.actif } : x)) }));
                  toast(`Règle ${r.actif ? "désactivée" : "activée"}.`);
                }} />
              </Carte>
            </li>
          ))}
        </ul>
      )}

      {onglet === "cles" && (
        <Tableau lignes={data.clesApi} colonnes={colCles} cle={(k) => k.id}
          vide={{ titre: "Aucune clé d'API", texte: "Créez une clé pour connecter une application tierce.", action: <Bouton icone={Plus} onClick={() => setForm("cle")}>Créer une clé</Bouton> }} />
      )}

      <FormulaireModale
        titre="Ajouter un webhook" ouverte={form === "webhook"} onFermer={() => setForm(null)} libelleValider="Ajouter"
        champs={[
          { nom: "url", libelle: "Adresse de réception (HTTPS)", placeholder: "https://…" },
          { nom: "evenement", libelle: "Événement", type: "choix", options: EVENEMENTS.map((e) => ({ valeur: e, libelle: e })) },
        ]}
        onValider={(v) => {
          if (!/^https:\/\/\S+\.\S+/.test(v.url)) {
            toast("L'adresse doit commencer par https:// et être complète.", "info");
            return;
          }
          maj((d) => ({ ...d, webhooks: [...d.webhooks, { id: `w${d.webhooks.length + 1}`, url: v.url, evenement: v.evenement, actif: true, derniereLivraison: "Jamais", succes: 1 }] }));
          setForm(null);
          toast("Webhook ajouté.");
        }}
      />

      <FormulaireModale
        titre="Créer une clé d'API" ouverte={form === "cle"} onFermer={() => setForm(null)} libelleValider="Créer la clé"
        champs={[
          { nom: "nom", libelle: "Nom de l'application" },
          { nom: "perimetre", libelle: "Périmètre", type: "choix", options: ["Tous modules · toutes agences", "Ventes, Stocks · toutes agences", "Stocks · toutes agences"].map((p) => ({ valeur: p, libelle: p })) },
        ]}
        onValider={(v) => {
          maj((d) => ({ ...d, clesApi: [...d.clesApi, { id: `k${d.clesApi.length + 1}`, nom: v.nom, prefixe: `wsd_live_${(d.clesApi.length + 10).toString(16)}e7`, perimetre: v.perimetre, creeLe: TODAY, dernierUsage: "Jamais" }] }));
          setForm(null);
          toast(`Clé « ${v.nom} » créée.`);
        }}
      />
    </>
  );
}

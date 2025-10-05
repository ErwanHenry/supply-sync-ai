'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaRocket, FaChartLine, FaBolt, FaShieldAlt, FaGlobe } from 'react-icons/fa'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Send to backend or email service
    console.log('Demo requested:', email)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FaBolt className="text-blue-400 text-2xl" />
              <span className="text-2xl font-bold text-white">SupplySync AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition">Fonctionnalités</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition">Tarifs</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition">Contact</a>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                Démo Gratuite
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Éliminez les erreurs d'inventaire
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                avec l'Intelligence Artificielle
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              SupplySync AI synchronise votre ERP en temps réel et détecte les anomalies avant qu'elles ne deviennent des erreurs coûteuses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400">87%</div>
                <div className="text-slate-400">Précision IA</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400">&lt;2s</div>
                <div className="text-slate-400">Latence Sync</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">€2M</div>
                <div className="text-slate-400">Économies/an</div>
              </div>
            </div>

            {/* CTA Form */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre-email@entreprise.com"
                    required
                    className="flex-1 px-6 py-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg font-semibold transition shadow-lg shadow-blue-500/50"
                  >
                    Démo Gratuite
                  </button>
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  Aucune carte bancaire requise • Démo en 15 minutes
                </p>
              </form>
            ) : (
              <div className="max-w-md mx-auto bg-green-900/30 border border-green-700 rounded-lg p-6">
                <FaCheckCircle className="text-green-400 text-4xl mx-auto mb-3" />
                <p className="text-white text-lg">
                  Merci ! Nous vous contactons sous 24h pour planifier votre démo.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-slate-400 mb-8">Utilisé par des entreprises innovantes en Europe</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            <div className="text-2xl font-bold text-white">ACME Corp</div>
            <div className="text-2xl font-bold text-white">TechSupply GmbH</div>
            <div className="text-2xl font-bold text-white">RetailPlus</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Les erreurs d'inventaire coûtent cher
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-red-400 text-2xl">❌</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ruptures de stock</h3>
                    <p className="text-slate-400">Pertes de ventes et clients mécontents</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-red-400 text-2xl">❌</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Surstock</h3>
                    <p className="text-slate-400">Capital immobilisé et coûts de stockage</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-red-400 text-2xl">❌</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Erreurs manuelles</h3>
                    <p className="text-slate-400">Synchronisation ERP fastidieuse et sujette aux erreurs</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-800/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Impact financier</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-white mb-2">
                    <span>Erreurs de commande</span>
                    <span className="font-bold">€500K-2M/an</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-white mb-2">
                    <span>Temps perdu</span>
                    <span className="font-bold">40h/semaine</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-white mb-2">
                    <span>Clients perdus</span>
                    <span className="font-bold">15-25%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Une plateforme complète pour votre inventaire
            </h2>
            <p className="text-xl text-slate-400">
              5 ERPs supportés • Sync temps réel • IA de pointe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-800/30 rounded-xl p-8"
            >
              <FaRocket className="text-blue-400 text-4xl mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Sync Temps Réel</h3>
              <p className="text-slate-400 mb-4">
                Synchronisation automatique via webhooks avec latence &lt;2 secondes. Fini les exports CSV manuels.
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> SAP S/4HANA
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Oracle Fusion
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Dynamics 365
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> NetSuite
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Odoo
                </li>
              </ul>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-cyan-900/40 to-slate-900/40 border border-cyan-800/30 rounded-xl p-8"
            >
              <FaChartLine className="text-cyan-400 text-4xl mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Détection d'Anomalies</h3>
              <p className="text-slate-400 mb-4">
                IA avec 87% de précision pour détecter prix suspects, stocks impossibles, sauts anormaux.
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Isolation Forest + LSTM
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Alertes en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Actions recommandées
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Faux positifs &lt;10%
                </li>
              </ul>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-green-900/40 to-slate-900/40 border border-green-800/30 rounded-xl p-8"
            >
              <FaBolt className="text-green-400 text-4xl mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Prévisions Demande</h3>
              <p className="text-slate-400 mb-4">
                Algorithme Prophet + LSTM pour anticiper la demande avec 8.5% MAPE. Optimisez vos stocks.
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Prédictions 7-30 jours
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Intervalles de confiance
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Saisonnalité détectée
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Précision 91.5%
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-700/50 rounded-2xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                ROI en moins de 3 mois
              </h2>
              <p className="text-xl text-slate-300">
                Nos clients économisent en moyenne €800K/an
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-blue-400 mb-2">90%</div>
                <div className="text-slate-300">Réduction des erreurs</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-cyan-400 mb-2">75%</div>
                <div className="text-slate-300">Temps gagné</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">€800K</div>
                <div className="text-slate-300">Économies/an</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-yellow-400 mb-2">2.8x</div>
                <div className="text-slate-300">ROI moyen</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tarifs transparents
            </h2>
            <p className="text-xl text-slate-400">
              Choisissez le plan adapté à votre entreprise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <div className="text-4xl font-bold text-blue-400 mb-6">
                €2,000<span className="text-lg text-slate-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> Jusqu'à 10,000 SKUs
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> 1 connexion ERP
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> 5 utilisateurs
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> Support email
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> Détection anomalies
                </li>
              </ul>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
                Commencer
              </button>
            </div>

            {/* Professional (Popular) */}
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-2 border-blue-500 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Le plus populaire
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
              <div className="text-4xl font-bold text-blue-400 mb-6">
                €8,000<span className="text-lg text-slate-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white">
                  <FaCheckCircle className="text-green-400" /> Jusqu'à 50,000 SKUs
                </li>
                <li className="flex items-center gap-2 text-white">
                  <FaCheckCircle className="text-green-400" /> 2 connexions ERP
                </li>
                <li className="flex items-center gap-2 text-white">
                  <FaCheckCircle className="text-green-400" /> 20 utilisateurs
                </li>
                <li className="flex items-center gap-2 text-white">
                  <FaCheckCircle className="text-green-400" /> Support prioritaire + Slack
                </li>
                <li className="flex items-center gap-2 text-white">
                  <FaCheckCircle className="text-green-400" /> Prévisions demande
                </li>
                <li className="flex items-center gap-2 text-white">
                  <FaCheckCircle className="text-green-400" /> Dashboard personnalisé
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg font-semibold transition">
                Commencer
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-blue-400 mb-6">
                Sur mesure
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> SKUs illimités
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> ERPs multiples
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> Utilisateurs illimités
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> Success Manager dédié
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> SLA 99.9%
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <FaCheckCircle className="text-green-400" /> Intégrations custom
                </li>
              </ul>
              <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition">
                Nous contacter
              </button>
            </div>
          </div>

          <p className="text-center text-slate-400 mt-8">
            Setup fee: €10,000 - €50,000 (one-time) • Pas d'engagement • Annulation à tout moment
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à éliminer vos erreurs d'inventaire ?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Rejoignez les entreprises qui économisent des millions avec SupplySync AI
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-12 py-4 rounded-lg text-lg font-semibold transition shadow-lg shadow-blue-500/50">
            Réserver une démo gratuite
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaBolt className="text-blue-400 text-2xl" />
                <span className="text-xl font-bold text-white">SupplySync AI</span>
              </div>
              <p className="text-slate-400">
                B2B Inventory Truth Engine powered by AI
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition">Intégrations</a></li>
                <li><a href="#" className="hover:text-white transition">Sécurité</a></li>
                <li><a href="#" className="hover:text-white transition">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Ressources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Guides</a></li>
                <li><a href="#" className="hover:text-white transition">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 SupplySync AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

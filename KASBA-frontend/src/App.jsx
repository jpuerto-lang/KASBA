import { useState } from 'react'
import ProfessorManagement from './components/ProfessorManagement'
import GrupManagement from './components/GrupManagement'
import AlumneManagement from './components/AlumneManagement'
import MateriaManagement from './components/MateriaManagement'
import HorariPerDia from './components/HorariPerDia'
import AssistenciaManagement from './components/AssistenciaManagement'
import HorariGrup from './components/HorariGrup'
import InformesPrincipal from './components/informes/InformesPrincipal'
import DiesNoLectiusManagement from './components/DiesNoLectiusManagement'

export default function App() {
  const [seccio, setSeccio] = useState('professors')

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24 }}>🏫 KASBA - Gestió acadèmica</h1>
      
      <nav style={{ marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={() => setSeccio('professors')} style={{ background: seccio === 'professors' ? '#2d5be3' : '#f0eee8', color: seccio === 'professors' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>👨‍🏫 Professors</button>
        <button onClick={() => setSeccio('grups')} style={{ background: seccio === 'grups' ? '#2d5be3' : '#f0eee8', color: seccio === 'grups' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>👥 Grups</button>
        <button onClick={() => setSeccio('alumnes')} style={{ background: seccio === 'alumnes' ? '#2d5be3' : '#f0eee8', color: seccio === 'alumnes' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>🧑‍🎓 Alumnes</button>
        <button onClick={() => setSeccio('materies')} style={{ background: seccio === 'materies' ? '#2d5be3' : '#f0eee8', color: seccio === 'materies' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📚 Matèries</button>
        <button onClick={() => setSeccio('horaris')} style={{ background: seccio === 'horaris' ? '#2d5be3' : '#f0eee8', color: seccio === 'horaris' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📅 Horari (Disseny)</button>
        <button onClick={() => setSeccio('horari_grup')} style={{ background: seccio === 'horari_grup' ? '#2d5be3' : '#f0eee8', color: seccio === 'horari_grup' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📋 Horari (Visor)</button>
        <button onClick={() => setSeccio('assistencia')} style={{ background: seccio === 'assistencia' ? '#2d5be3' : '#f0eee8', color: seccio === 'assistencia' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>✍️ Assistència</button>
        <button onClick={() => setSeccio('dies_no_lectius')} style={{ background: seccio === 'dies_no_lectius' ? '#2d5be3' : '#f0eee8', color: seccio === 'dies_no_lectius' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📅 Dies no lectius</button>
        <button onClick={() => setSeccio('informes')} style={{ background: seccio === 'informes' ? '#2d5be3' : '#f0eee8', color: seccio === 'informes' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📊 Informes</button>
      </nav>

      {seccio === 'professors' && <ProfessorManagement />}
      {seccio === 'grups' && <GrupManagement />}
      {seccio === 'alumnes' && <AlumneManagement />}
      {seccio === 'materies' && <MateriaManagement />}
      {seccio === 'horaris' && <HorariPerDia />}
      {seccio === 'horari_grup' && <HorariGrup />}
      {seccio === 'assistencia' && <AssistenciaManagement />}
      {seccio === 'dies_no_lectius' && <DiesNoLectiusManagement />}
      {seccio === 'informes' && <InformesPrincipal />}
    </div>
  )
}

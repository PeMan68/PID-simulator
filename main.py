import tkinter as tk
from tkinter import ttk, simpledialog, messagebox
import numpy as np
import matplotlib
matplotlib.use('TkAgg')
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import os
import sys

def resource_path(relative_path):
    """Får sökväg till resource, fungerar både för dev och PyInstaller .exe"""
    try:
        # PyInstaller skapar en temp folder och lagrar sökvägen i _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# --- Tooltip-klass för hjälpsystem ---
class ToolTip:
    """
    Skapar tooltips som visas vid hover över widgets.
    """
    def __init__(self, widget, text, delay=1000):
        self.widget = widget
        self.text = text
        self.delay = delay
        self.tooltip_window = None
        self.timer_id = None
        
        # Bind events
        self.widget.bind("<Enter>", self.on_enter)
        self.widget.bind("<Leave>", self.on_leave)
        self.widget.bind("<Motion>", self.on_motion)
    
    def on_enter(self, event=None):
        """Startar timer när musen kommer över widget"""
        self.cancel_timer()
        self.timer_id = self.widget.after(self.delay, self.show_tooltip)
    
    def on_leave(self, event=None):
        """Döljer tooltip när musen lämnar widget"""
        self.cancel_timer()
        self.hide_tooltip()
    
    def on_motion(self, event=None):
        """Återstartar timer vid musrörelse"""
        self.cancel_timer()
        self.timer_id = self.widget.after(self.delay, self.show_tooltip)
    
    def cancel_timer(self):
        """Avbryter pending timer"""
        if self.timer_id:
            self.widget.after_cancel(self.timer_id)
            self.timer_id = None
    
    def show_tooltip(self):
        """Visar tooltip-rutan"""
        if self.tooltip_window:
            return
            
        x = self.widget.winfo_rootx() + 25
        y = self.widget.winfo_rooty() + 25
        
        self.tooltip_window = tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        
        # Skapa tooltip-innehåll
        frame = tk.Frame(tw, background="#ffffe0", relief="solid", borderwidth=1)
        frame.pack()
        
        label = tk.Label(frame, text=self.text, background="#ffffe0", 
                        font=("Arial", "9"), wraplength=300, justify="left")
        label.pack(padx=2, pady=2)
    
    def hide_tooltip(self):
        """Döljer tooltip-rutan"""
        if self.tooltip_window:
            self.tooltip_window.destroy()
            self.tooltip_window = None

# --- Hjälptextsystem ---
HELP_TEXTS = {
    # Regulatorparametrar
    "kp": "Proportionalförstärkning - hur kraftigt regulatorn reagerar på avvikelser från börvärdet.",
    "ti": "Integreringstid - hur snabbt regulatorn eliminerar kvarstående fel. Lägre värde = snabbare elimination.",
    "td": "Deriveringstid - hur regulatorn förutser förändringar. Motverkar snabba förändringar i processvärdet.",
    "preset": "Välj regulatortyp: OnOff (tvånivå), P (bara proportionell), PI (P+I), PID (alla komponenter).",
    "setpoint": "Börvärde - det värde som processen ska regleras mot.",
    "umin": "Minsta utsignal från regulatorn (%).",
    "umax": "Största utsignal från regulatorn (%).",
    "antiwindup": "Förhindrar att integratorn 'vindar upp' när utsignalen är mättad (på min/max).",
    "manuellt": "Manuellt läge - regulatorn är frånkopplad, utsignalen styrs manuellt.",
    "manual_out": "Manuell utsignal när manuellt läge är aktiverat.",
    
    # On/Off specifikt
    "hysteresis_mode": "Var hysteresisen ska tillämpas: Över börvärdet, Under börvärdet, eller Båda sidorna.",
    "hysteresis_high": "Hysteresis över börvärdet - hur mycket över börvärdet processen får gå innan avstängning.",
    "hysteresis_low": "Hysteresis under börvärdet - hur mycket under börvärdet processen får gå innan påslagning.",
    
    # Systemparametrar
    "process_k": "Processförstärkning - hur mycket processvärdet ändras när styrsignalen ändras.",
    "process_t": "Tidskonstant - hur snabbt processen reagerar på förändringar i styrsignalen.",
    "process_dead": "Dötid - fördröjning innan processen börjar reagera på styrsignalförändringar.",
    "integrerande": "Integrerande process - processvariabler som naturligt ackumulerar (ex. nivå i tank).",
    "fout": "Utflöde från processen (för integrerande processer som nivåreglering).",
    "normalvarde": "Normalvärde - det värde processen har vid 0% styrsignal.",
    "matområde_min": "Nedre gräns för mätområdet i fysiska enheter.",
    "matområde_max": "Övre gräns för mätområdet i fysiska enheter.",
    "enhetslös_k": "Enhetslös K - använd industristandard (%/%) istället för traditionell (°C/%) förstärkning.",
    "percent_mode": "Visa parametrar i procent av mätområdet istället för fysiska enheter.",
    "signalstörning": "Aktivera/inaktivera alla typer av signalstörningar på processen.",
    
    # Graf och export
    "graf_skala": "Min och max för värde-axeln.",
    "export_graf": "Exportera aktuella grafer som PNG-bild.",
    "export_data": "Exportera simuleringsdata som CSV-fil för vidare analys."
}

# --- Processmodeller ---
class Process:
    def __init__(self, K=1.0, T=10.0, dead_time=2.0, integrerande=False, Fout=0.0, normalvarde=0.0, 
                 matområde_min=0.0, matområde_max=100.0, enhetslös_K=False):
        self.K = K  # Processförstärkning - enhetslös om enhetslös_K=True, annars °C/%
        self.T = T
        self.dead_time = dead_time
        self.integrerande = integrerande
        self.Fout = Fout  # Utflöde (för nivåreglering)
        self.normalvarde = normalvarde  # Normalvärde (NV) i ingenjörsenheter
        self.matområde_min = matområde_min  # Mätområde minimum (°C)
        self.matområde_max = matområde_max  # Mätområde maximum (°C)
        self.enhetslös_K = enhetslös_K  # True = K är enhetslös (% till %), False = K är °C/%
        self.y_hist = [normalvarde]*int(dead_time+1)  # Starta med normalvärdet
        self.u_hist = [0.0]*int(dead_time+1)
        self.y = normalvarde  # Starta på normalvärdet (ingenjörsenheter)
        self.t = 0

    def to_percent(self, value_eng):
        """Konvertera från ingenjörsenheter till procent baserat på mätområdet"""
        if self.matområde_max == self.matområde_min:
            return 0.0
        return 100.0 * (value_eng - self.matområde_min) / (self.matområde_max - self.matområde_min)
    
    def from_percent(self, value_pct):
        """Konvertera från procent till ingenjörsenheter baserat på mätområdet"""
        return self.matområde_min + (self.matområde_max - self.matområde_min) * value_pct / 100.0

    def step(self, u, dt):
        self.u_hist.append(u)
        u_delayed = self.u_hist.pop(0)
        
        # Skydda mot division med noll
        if self.T <= 0:
            self.T = 1e-6  # Minimal tidskonstant
        
        if self.enhetslös_K:
            # Enhetslös K: Konvertera y till %, beräkna i %, konvertera tillbaka
            y_pct = self.to_percent(self.y)
            nv_pct = self.to_percent(self.normalvarde)
            
            if self.integrerande:
                # Nivåreglering: inflöde (styrsignal) minus utflöde
                dy_pct = (self.K * u_delayed - self.Fout) * dt / self.T
            else:
                # Normalvärde: y går mot normalvarde om u=0
                dy_pct = (-(y_pct - nv_pct) + self.K * u_delayed) * dt / self.T
            
            # Konvertera tillbaka till ingenjörsenheter
            new_y_pct = y_pct + dy_pct
            self.y = self.from_percent(new_y_pct)
        else:
            # Original metod: K i °C/%
            if self.integrerande:
                # Nivåreglering: inflöde (styrsignal) minus utflöde
                self.y += (self.K * u_delayed - self.Fout) * dt / self.T
            else:
                # Normalvärde: y går mot normalvarde om u=0
                self.y += (-(self.y - self.normalvarde) + self.K * u_delayed) * dt / self.T
        
        self.y_hist.append(self.y)
        self.y_hist.pop(0)
        self.t += dt
        return self.y

# --- On/Off-regulator ---
class OnOffController:
    def __init__(self, hysteresis_type="both", hysteresis_high=2.0, hysteresis_low=2.0):
        self.hysteresis_type = hysteresis_type  # "upper", "lower", "both"
        self.hysteresis_high = hysteresis_high  # Hysteresis över börvärdet
        self.hysteresis_low = hysteresis_low    # Hysteresis under börvärdet
        self.output = 0.0  # Aktuell utsignal (0 eller 100)
        
    def step(self, setpoint, pv, umin=0.0, umax=100.0):
        """On/Off reglering med konfigurerbar hysteresis"""
        if self.hysteresis_type == "upper":
            # Endast hysteresis över börvärdet
            if pv < setpoint:
                self.output = umax  # Slå på
            elif pv > setpoint + self.hysteresis_high:
                self.output = umin  # Slå av
        elif self.hysteresis_type == "lower":
            # Endast hysteresis under börvärdet
            if pv > setpoint:
                self.output = umin  # Slå av
            elif pv < setpoint - self.hysteresis_low:
                self.output = umax  # Slå på
        else:  # "both"
            # Hysteresis både över och under börvärdet
            if pv < setpoint - self.hysteresis_low:
                self.output = umax  # Slå på
            elif pv > setpoint + self.hysteresis_high:
                self.output = umin  # Slå av
        
        # Begränsa utsignal
        self.output = max(umin, min(umax, self.output))
        return self.output

# --- PID-regulator ---
class PID:
    def __init__(self, Kp=1.0, Ti=10.0, Td=0.0, dt=1.0):
        self.Kp = Kp
        self.Ti = Ti
        self.Td = Td
        self.dt = dt
        self.integral = 0.0
        self.prev_error = 0.0
        self.prev_pv = 0.0

    def step(self, setpoint, pv, umin=0.0, umax=100.0, antiwindup=False):
        error = setpoint - pv
        # Beräkna preliminär integral
        integral_candidate = self.integral + error * self.dt
        derivative = (pv - self.prev_pv) / self.dt
        
        # Hantera integral term - om Ti är 0 eller mycket liten, inaktivera I-verkan
        if self.Ti > 0.001:  # Undvik division med noll
            i_term = (1/self.Ti) * integral_candidate
        else:
            i_term = 0.0
            
        u_unclamped = self.Kp * (error + i_term - self.Td*derivative)
        # Begränsa utsignal
        u = max(umin, min(umax, u_unclamped))
        # Anti-windup: endast integrera om utsignalen inte är mättad, eller om antiwindup är av
        if antiwindup:
            # Integrera bara om inte mättad, eller om felet "hjälper" att komma in i området
            if (u == umin and error > 0) or (u == umax and error < 0) or (umin < u < umax):
                self.integral = integral_candidate
        else:
            self.integral = integral_candidate
        self.prev_error = error
        self.prev_pv = pv
        return u, error, self.integral, derivative

# --- GUI och Simulering ---
class PIDSimulatorApp:
    def on_mouse_move(self, event):
        # Visa vertikal markör och tooltip endast i paus- eller stega-läge
        if self.running:
            # Göm markör och tooltip om simulering körs
            if self.cursor_line:
                for line in self.cursor_line:
                    line.set_visible(False)
                self.canvas.draw()
            if self.tooltip:
                self.tooltip.place_forget()
            return
        # Endast visa om musen är över någon av axlarna
        if event.inaxes not in self.axs:
            if self.cursor_line:
                for line in self.cursor_line:
                    line.set_visible(False)
                self.canvas.draw()
            if self.tooltip:
                self.tooltip.place_forget()
            return
        t_vals = self.t
        if len(t_vals) == 0 or event.xdata is None:
            return
        x = event.xdata
        idx = np.argmin(np.abs(np.array(t_vals) - x))
        tid = t_vals[idx]
        # Skapa markörlinjer om de inte finns
        if not self.cursor_line:
            self.cursor_line = []
            for ax in self.axs:
                line, = ax.plot([tid, tid], ax.get_ylim(), color='red', linestyle='--', linewidth=1, zorder=10)
                self.cursor_line.append(line)
        # Flytta markörlinjer
        for i, ax in enumerate(self.axs):
            self.cursor_line[i].set_xdata([tid, tid])
            self.cursor_line[i].set_visible(True)
            # Anpassa höjd om axelns y-lim ändrats
            self.cursor_line[i].set_ydata(ax.get_ylim())
        self.canvas.draw()
        # Hämta värden
        yv = self.y[idx] if idx < len(self.y) else None
        uv = self.u[idx] if idx < len(self.u) else None
        ev = self.e[idx] if idx < len(self.e) else None
        iv = self.i[idx] if idx < len(self.i) else None
        dv = self.d[idx] if idx < len(self.d) else None
        kp = self.parse_float(self.kp_var)
        ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0.0
        td = self.parse_float(self.td_var) if self.d_active_var.get() else 0.0
        # Beräkna P, I, D-bidrag
        p_term = kp * ev if ev is not None else None
        i_term = kp / ti * iv if (iv is not None and ti != 0) else None
        d_term = -kp * td * dv if (dv is not None) else None
        # Bygg text
        text = f"t = {tid:.0f}\n"
        text += f"y = {yv:.2f}\n" if yv is not None else "y = -\n"
        text += f"u = {uv:.1f}%\n" if uv is not None else "u = -\n"
        if p_term is not None:
            text += f"P = {p_term:.2f}\n"
        if i_term is not None:
            text += f"I = {i_term:.2f}\n"
        if d_term is not None:
            text += f"D = {d_term:.2f}\n"
        # Visa totalsumma
        if p_term is not None or i_term is not None or d_term is not None:
            total = sum([v for v in [p_term, i_term, d_term] if v is not None])
            text += f"Summa = {total:.2f}"
        # Skapa/uppdatera tooltip
        parent = self.canvas.get_tk_widget().master
        if not self.tooltip or not self.tooltip.winfo_exists():
            self.tooltip = tk.Label(parent, text=text, bg="#ffffe0", relief="solid", borderwidth=1, font=("Arial", 9))
        else:
            self.tooltip.config(text=text)
        # Placera tooltip nära musen (justera för parent-fönster)
        x_root = parent.winfo_pointerx() - parent.winfo_rootx() + 20
        y_root = parent.winfo_pointery() - parent.winfo_rooty() + 20
 # Hämta canvasbredd och tooltipbredd
        canvas_width = self.canvas.get_tk_widget().winfo_width()
        self.tooltip.update_idletasks()  # Uppdatera storlek
        tooltip_width = self.tooltip.winfo_width()
        # Om tooltip går utanför canvas till höger, placera till vänster om musen
        if x_root + tooltip_width > canvas_width:
            x_root = max(0, x_root - tooltip_width - 40)
        self.tooltip.place(x=x_root, y=y_root)
    def __init__(self, root):
        self.root = root
        root.title("PID-simulator v1.6.1")
        # Öka fönsterbredd för att ge plats åt tooltip
        root.geometry("1100x700")
        root.minsize(1000, 600)
        # Parametrar
        self.dt = 1.0
        self.n_steps = 2000
        self.current_step = 0
        self.running = False
        self._auto_paused = False
        # Normalvärde (NV) - måste definieras före Process
        self.nv_var = tk.DoubleVar(value=23.0)  # Exempel: rumstemperatur
        
        # Mätområde för enhetslös K-beräkning
        self.matområde_min_var = tk.DoubleVar(value=-10.0)
        self.matområde_max_var = tk.DoubleVar(value=120.0)
        self.enhetslös_K_var = tk.BooleanVar(value=False)
        
        # Process och PID
        self.process = Process(K=2.0, T=15.0, dead_time=3.0, integrerande=False, Fout=0.0, 
                              normalvarde=self.parse_float(self.nv_var),
                              matområde_min=self.parse_float(self.matområde_min_var),
                              matområde_max=self.parse_float(self.matområde_max_var),
                              enhetslös_K=self.enhetslös_K_var.get())
        self.pid = PID(Kp=2.0, Ti=10.0, Td=1.0, dt=self.dt)
        self.setpoint = 50.0
        # Begränsning och antiwindup
        self.u_min = 0.0
        self.u_max = 100.0
        self.antiwindup_var = tk.BooleanVar(value=True)
        # Historik
        self.t = [0]
        self.y = [self.parse_float(self.nv_var)]  # Starta på normalvärdet
        self.u = [0]
        self.e = [0]
        self.i = [0]
        self.d = [0]
        self.sp = [self.setpoint]
        
        # Simulation history för jämförelser
        self.simulation_history = []
        self.max_history_size = 5
        self.next_color_id = 0  # Räknare för permanenta färg-ID
        # Tidsfönster
        self.window_mode = tk.StringVar(value="all")  # "all" eller "window"
        self.window_size = tk.IntVar(value=30)
        self.window_start = 0
        # PID-komponent aktivering
        self.i_active_var = tk.BooleanVar(value=True)
        self.d_active_var = tk.BooleanVar(value=True)
        # Autopaus-blockering
        self.autopause_var = tk.BooleanVar(value=True)
        # Simuleringshastighet (delay i ms mellan steg)
        self.speed_var = tk.IntVar(value=300)  # 300ms standard
        
        # Manuellt läge och stegsvarsanalys
        self.manual_mode_var = tk.BooleanVar(value=False)
        self.manual_output_var = tk.DoubleVar(value=0.0)
        
        # Preset-kontroller
        self.preset_mode = tk.StringVar(value="OnOff")  # "OnOff", "P", "PI", "PID"
        self.signal_disturbance_var = tk.BooleanVar(value=False)
        
        # On/Off regulator-parametrar
        self.onoff_hysteresis_type = tk.StringVar(value="both")  # "upper", "lower", "both"
        self.onoff_hysteresis_high = tk.DoubleVar(value=2.0)
        self.onoff_hysteresis_low = tk.DoubleVar(value=2.0)
        self.onoff_controller = OnOffController()
        
        # Enhetsväxling (True = %, False = verkliga värden)
        self.percent_mode_var = tk.BooleanVar(value=False)
        
        # Sätt skalning till samma som mätområdet som default
        self.process_min = tk.DoubleVar(value=self.parse_float(self.matområde_min_var))
        self.process_max = tk.DoubleVar(value=self.parse_float(self.matområde_max_var))
        
        # Processenhet för y-axeletiketter
        self.process_unit_var = tk.StringVar(value="°C")  # Default temperatur
        
        # Variabler för att spåra osparade ändringar
        self.unsaved_changes = False
        self.changed_widgets = set()  # Set för att spåra vilka widgets som ändrats
        self.highlight_labels = {}  # Spara referenser till highlight-labels
        self._ignore_changes = False  # Flagga för att ignorera automatiska ändringar
        
        # Sparade parametrar som används under simulering (uppdateras endast vid "Spara ändringar")
        self.saved_params = {
            'kp': self.pid.Kp,
            'ti': self.pid.Ti, 
            'td': self.pid.Td,
            'i_active': self.i_active_var.get(),
            'd_active': self.d_active_var.get(),
            'preset': self.preset_mode.get(),  # Spara initial preset-typ
            'setpoint': self.setpoint,
            'nv': self.parse_float(self.nv_var),
            'matområde_min': self.parse_float(self.matområde_min_var),
            'matområde_max': self.parse_float(self.matområde_max_var),
            'proc_k': self.process.K,
            'proc_t': self.process.T,
            'proc_dead_time': self.process.dead_time,
            'u_min': self.u_min,
            'u_max': self.u_max,
            'onoff_hysteresis_high': self.parse_float(self.onoff_hysteresis_high),
            'onoff_hysteresis_low': self.parse_float(self.onoff_hysteresis_low),
            'onoff_hysteresis_type': self.onoff_hysteresis_type.get(),
            'graph_min': self.parse_float(self.matområde_min_var),  # Graf-skala min
            'graph_max': self.parse_float(self.matområde_max_var)   # Graf-skala max
        }
        
        # GUI
        self.create_widgets()
        # Lägg till change callbacks EFTER att widgets skapats
        self.setup_change_tracking()
        # Sätt upp enhetlig hantering av numerisk input med decimal comma
        self.setup_numeric_input_handling()
        # Tooltip och markör
        self.tooltip = None
        self.cursor_line = None  # For vertical marker
        # Uppdatera hastighetsetikett
        self.update_speed_label()
        # Initiera preset-val
        self.on_preset_change()
        self.update_plot()
        # Uppdatera knappar inklusive dynamisk start-knapp text
        self.update_buttons()

    def create_widgets(self):
        # Konfigurera ttk styles för highlighting
        style = ttk.Style()
        try:
            # Skapa en highlighted style för Entry widgets med orange ram
            style.configure('Highlighted.TEntry', 
                          fieldbackground='lightyellow',
                          borderwidth=4,
                          relief='solid',
                          bordercolor='orange',
                          lightcolor='orange',
                          darkcolor='orange')
            # Även när focused
            style.map('Highlighted.TEntry',
                     fieldbackground=[('focus', 'lightyellow')],
                     bordercolor=[('focus', 'red')])
        except Exception:
            pass  # Ignorera om style inte kan sättas
            
        # Huvudcontainer med notebook för flikar
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Simulator-flik
        self.simulator_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.simulator_frame, text="Simulator")
        
        # Hjälp-flik
        self.help_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.help_frame, text="Hjälp")
        
        # Teori-flik  
        self.theory_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.theory_frame, text="Teori")
        
        # Skapa simulator-innehåll i vänster panel
        frame = ttk.Frame(self.simulator_frame)
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Preset-kontroller (överst)
        preset_frame = ttk.LabelFrame(frame, text="Regulator-presets")
        preset_frame.pack(fill=tk.X, padx=5, pady=5)
            
        # Preset-val (radiobuttons)
        preset_row1 = ttk.Frame(preset_frame) 
        preset_row1.pack(fill=tk.X, padx=5, pady=2)
            
        ttk.Radiobutton(preset_row1, text="On/Off", variable=self.preset_mode, value="OnOff", command=self.on_preset_change).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(preset_row1, text="P-reglering", variable=self.preset_mode, value="P", command=self.on_preset_change).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(preset_row1, text="PI-reglering", variable=self.preset_mode, value="PI", command=self.on_preset_change).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(preset_row1, text="PID-reglering", variable=self.preset_mode, value="PID", command=self.on_preset_change).pack(side=tk.LEFT, padx=5)

        # Systemparametrar
        sys_frame = ttk.LabelFrame(frame, text="Systemparametrar")
        sys_frame.pack(fill=tk.X, padx=5, pady=5)
        self.sys_frame = sys_frame  # Spara referens

        # Första raden - Grundparametrar
        sys_row1 = ttk.Frame(sys_frame) 
        sys_row1.pack(fill=tk.X, padx=5, pady=2)
        ttk.Checkbutton(sys_row1, text="Enhetslös K", variable=self.enhetslös_K_var, command=self.on_enhetslös_K_change).pack(side=tk.LEFT, padx=5)
        ttk.Label(sys_row1, text="K").pack(side=tk.LEFT, padx=5)
        self.proc_k_var = tk.StringVar(value=str(self.process.K))
        self.proc_k_entry = ttk.Entry(sys_row1, textvariable=self.proc_k_var, width=6)
        self.proc_k_entry.pack(side=tk.LEFT, padx=5)
        self.proc_t_label = ttk.Label(sys_row1, text="T")
        self.proc_t_label.pack(side=tk.LEFT, padx=5)
        self.proc_t_var = tk.StringVar(value=str(self.process.T))
        self.proc_t_entry = ttk.Entry(sys_row1, textvariable=self.proc_t_var, width=6)
        self.proc_t_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(sys_row1, text="Dötid").pack(side=tk.LEFT, padx=5)
        self.proc_dead_var = tk.StringVar(value=str(self.process.dead_time))
        self.proc_dead_entry = ttk.Entry(sys_row1, textvariable=self.proc_dead_var, width=6)
        self.proc_dead_entry.pack(side=tk.LEFT, padx=5)
        
        # ttk.Entry(sys_frame, textvariable=self.proc_k_var, width=6).grid(row=0, column=1)
        # ttk.Label(sys_frame, text="T").grid(row=0, column=2)
        # ttk.Entry(sys_frame, textvariable=self.proc_t_var, width=6).grid(row=0, column=3)
        # ttk.Label(sys_frame, text="Dötid").grid(row=0, column=4)
        # ttk.Entry(sys_frame, textvariable=self.proc_dead_var, width=6).grid(row=0, column=5)
        
        # Integrerande checkbox och normalvärde
        self.integrerande_var = tk.BooleanVar(value=self.process.integrerande)
        self.integrerande_check = ttk.Checkbutton(sys_row1, text="Integrerande", variable=self.integrerande_var, command=self.on_integrerande_change)
        self.integrerande_check.pack(side=tk.LEFT, padx=5)
        
        # Utflöde (visas endast för integrerande processer)
        self.utflode_label = ttk.Label(sys_row1, text="Utflöde")
        self.utflode_label.pack(side=tk.LEFT, padx=5)
        self.proc_fout_var = tk.StringVar(value=str(self.process.Fout))
        self.utflode_entry = ttk.Entry(sys_row1, textvariable=self.proc_fout_var, width=6)
        self.utflode_entry.pack(side=tk.LEFT, padx=5)
        
        # Andra raden - Normalvärde
        sys_row2 = ttk.Frame(sys_frame) 
        sys_row2.pack(fill=tk.X, padx=5, pady=2)
        ttk.Label(sys_row2, text="Normalvärde").pack(side=tk.LEFT, padx=5)
        self.nv_entry = ttk.Entry(sys_row2, textvariable=self.nv_var, width=6)
        self.nv_entry.pack(side=tk.LEFT, padx=5)
        ttk.Button(sys_row2, text="Spara systemparametrar", command=self.save_system_changes).pack(side=tk.RIGHT, padx=5)
        
        # Tredje raden - Störningar
        sys_row3 = ttk.Frame(sys_frame) 
        sys_row3.pack(fill=tk.X, padx=5, pady=2)
        self.signal_disturbance_check = ttk.Checkbutton(sys_row3, text="Signalstörning", variable=self.signal_disturbance_var, command=self.on_disturbance_change).pack(side=tk.LEFT, padx=5)
        
        # Störningar (döljs när signalstörning är av)
        self.disturbance_widgets = []
        
        brus_label = ttk.Label(sys_row3, text="Brus std")
        brus_label.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(brus_label)
        
        self.noise_std_var = tk.DoubleVar(value=0.0)
        self.noise_scale = ttk.Scale(sys_row3, from_=0.0, to=5.0, variable=self.noise_std_var, orient=tk.HORIZONTAL, length=100)
        self.noise_scale.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(self.noise_scale)
        
        self.noise_entry = ttk.Entry(sys_row3, textvariable=self.noise_std_var, width=5)
        self.noise_entry.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(self.noise_entry)
        
        puls_label = ttk.Label(sys_row3, text="Puls (storlek)")
        puls_label.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(puls_label)
        
        self.pulse_mag_var = tk.DoubleVar(value=10.0)
        self.pulse_entry = ttk.Entry(sys_row3, textvariable=self.pulse_mag_var, width=5)
        self.pulse_entry.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(self.pulse_entry)
        
        steg_label = ttk.Label(sys_row3, text="(steg)")
        steg_label.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(steg_label)
        
        self.pulse_dur_var = tk.IntVar(value=3)
        self.pulse_dur_entry = ttk.Entry(sys_row3, textvariable=self.pulse_dur_var, width=3)
        self.pulse_dur_entry.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(self.pulse_dur_entry)
        
        self.pulse_active = False
        self.pulse_steps_left = 0
        self.pulse_button = ttk.Button(sys_row3, text="Pulsstörning", command=self.trigger_pulse)
        self.pulse_button.pack(side=tk.LEFT, padx=5)
        self.disturbance_widgets.append(self.pulse_button)
        
        # Regulatorparametrar
        pid_frame = ttk.LabelFrame(frame, text="Regulatorparametrar")
        pid_frame.pack(fill=tk.X, padx=5, pady=5)
        self.pid_frame = pid_frame  # Spara referens för att komma åt children
        
        
        # Första raden
        pid_row1 = ttk.Frame(pid_frame) 
        pid_row1.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Label(pid_row1, text="Börvärde").pack(side=tk.LEFT, padx=5)
        self.sp_var = tk.StringVar(value=str(self.setpoint))
        self.sp_entry = ttk.Entry(pid_row1, textvariable=self.sp_var, width=8)
        self.sp_entry.pack(side=tk.LEFT, padx=5)
        
        # Enhetsetikett för börvärde
        if self.percent_mode_var.get():
            initial_unit = "%"
        else:
            initial_unit = self.process_unit_var.get()
        self.sp_unit_label = ttk.Label(pid_row1, text=initial_unit)
        self.sp_unit_label.pack(side=tk.LEFT, padx=2)
        
        # Andra raden
        pid_row2 = ttk.Frame(pid_frame) 
        pid_row2.pack(fill=tk.X, padx=5, pady=2)
        
        # Mätområde
        ttk.Label(pid_row2, text="Mätområde Min").pack(side=tk.LEFT, padx=5)
        self.matområde_min_entry = ttk.Entry(pid_row2, textvariable=self.matområde_min_var, width=6)
        self.matområde_min_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(pid_row2, text="Max").pack(side=tk.LEFT, padx=5)
        self.matområde_max_entry = ttk.Entry(pid_row2, textvariable=self.matområde_max_var, width=6)
        self.matområde_max_entry.pack(side=tk.LEFT, padx=5)

        # Tredje raden
        pid_row3 = ttk.Frame(pid_frame) 
        pid_row3.pack(fill=tk.X, padx=5, pady=2)
        # Utsignal min/max
        ttk.Label(pid_row3, text="Utsignal min (%)").pack(side=tk.LEFT, padx=5)
        self.u_min_var = tk.DoubleVar(value=0.0)
        self.u_min_entry = ttk.Entry(pid_row3, textvariable=self.u_min_var, width=6)
        self.u_min_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(pid_row3, text="max (%)").pack(side=tk.LEFT, padx=5)
        self.u_max_var = tk.DoubleVar(value=100.0)
        self.u_max_entry = ttk.Entry(pid_row3, textvariable=self.u_max_var, width=6)
        self.u_max_entry.pack(side=tk.LEFT, padx=5)

        # Fjärde raden - Alla regulatorparametrar
        pid_row4 = ttk.Frame(pid_frame)
        pid_row4.pack(fill=tk.X, padx=5, pady=2)
        
        # PID-parametrar
        self.pid_params_frame = ttk.Frame(pid_row4)
        self.pid_params_frame.pack(fill=tk.X, padx=5, pady=2)
        
        # Kp (alltid synlig för P, PI, PID)
        ttk.Label(self.pid_params_frame, text="Kp").pack(side=tk.LEFT, padx=5)
        self.kp_var = tk.StringVar(value=str(self.pid.Kp))
        self.kp_entry = ttk.Entry(self.pid_params_frame, textvariable=self.kp_var, width=6)
        self.kp_entry.pack(side=tk.LEFT, padx=5)
        
        # Ti (synlig för PI och PID)
        self.ti_frame = ttk.Frame(self.pid_params_frame)
        self.ti_frame.pack(side=tk.LEFT)
        ttk.Label(self.ti_frame, text="Ti").pack(side=tk.LEFT, padx=5)
        self.ti_var = tk.StringVar(value=str(self.pid.Ti))
        self.ti_entry = ttk.Entry(self.ti_frame, textvariable=self.ti_var, width=6)
        self.ti_entry.pack(side=tk.LEFT, padx=5)
        
        # Td (synlig för PID)
        self.td_frame = ttk.Frame(self.pid_params_frame)
        self.td_frame.pack(side=tk.LEFT)
        ttk.Label(self.td_frame, text="Td").pack(side=tk.LEFT, padx=5)
        self.td_var = tk.StringVar(value=str(self.pid.Td))
        self.td_entry = ttk.Entry(self.td_frame, textvariable=self.td_var, width=6)
        self.td_entry.pack(side=tk.LEFT, padx=5)
        
        # On/Off hysteresis-kontroller (samma rad som PID-parametrar)
        self.onoff_frame = ttk.Frame(pid_row4)
        self.onoff_frame.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Label(self.onoff_frame, text="Hysteresis:").grid(row=0, column=0, padx=2)
        ttk.Radiobutton(self.onoff_frame, text="Över", variable=self.onoff_hysteresis_type, value="upper", command=self.on_onoff_change).grid(row=0, column=1, padx=2)
        ttk.Radiobutton(self.onoff_frame, text="Under", variable=self.onoff_hysteresis_type, value="lower", command=self.on_onoff_change).grid(row=0, column=2, padx=2)
        ttk.Radiobutton(self.onoff_frame, text="Båda", variable=self.onoff_hysteresis_type, value="both", command=self.on_onoff_change).grid(row=0, column=3, padx=2)
        
        ttk.Label(self.onoff_frame, text="Hög:").grid(row=0, column=4, padx=(10,2))
        self.onoff_high_entry = ttk.Entry(self.onoff_frame, textvariable=self.onoff_hysteresis_high, width=4)
        self.onoff_high_entry.grid(row=0, column=5)
        
        ttk.Label(self.onoff_frame, text="Låg:").grid(row=0, column=6, padx=(5,2))
        self.onoff_low_entry = ttk.Entry(self.onoff_frame, textvariable=self.onoff_hysteresis_low, width=4)
        self.onoff_low_entry.grid(row=0, column=7)

        # Femte raden - Checkboxar
        pid_row5 = ttk.Frame(pid_frame)
        pid_row5.pack(fill=tk.X, padx=5, pady=2)
        
        # Anti-windup checkbox
        self.antiwindup_check = ttk.Checkbutton(pid_row5, text="Anti-windup", variable=self.antiwindup_var)
        self.antiwindup_check.pack(side=tk.LEFT, padx=(0,20))
 
        # Manuellt läge
        self.manual_check = ttk.Checkbutton(pid_row5, text="Manuellt läge", variable=self.manual_mode_var, command=self.on_manual_mode_change)
        self.manual_check.pack(side=tk.LEFT, padx=(0,10))
        
        ttk.Label(pid_row5, text="Manuell ut (%):").pack(side=tk.LEFT)
        self.manual_entry = ttk.Entry(pid_row5, textvariable=self.manual_output_var, width=6)
        self.manual_entry.pack(side=tk.LEFT, padx=5)
        self.manual_entry.configure(state="disabled")  # Inaktiverad från början
        
        # Spara regulatorparametrar knapp (flyttad upp för att spara utrymme)
        ttk.Button(pid_row5, text="Spara regulatorparametrar", command=self.save_regulator_changes).pack(side=tk.RIGHT, padx=5)
 
        # Stegsvarsanalys och enhetsväxling
        analysis_frame = ttk.LabelFrame(frame, text="Stegsvarsanalys och visning")
        analysis_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Första raden - Enhetsväxling
        row1_frame = ttk.Frame(analysis_frame)
        row1_frame.pack(fill=tk.X, padx=5, pady=2)
        
        self.percent_mode_check = ttk.Checkbutton(row1_frame, text="Visa i procent (%)", variable=self.percent_mode_var, command=self.on_percent_mode_change)
        self.percent_mode_check.pack(side=tk.LEFT, padx=5)
        
        # Enhetsval
        ttk.Label(row1_frame, text="Enhet:").pack(side=tk.LEFT, padx=(15,2))
        unit_combo = ttk.Combobox(row1_frame, textvariable=self.process_unit_var, width=6, values=["°C", "bar", "m³/h", "kg/h", "rpm", "%", "V", "A"])
        unit_combo.pack(side=tk.LEFT, padx=(0,15))
        unit_combo.bind("<<ComboboxSelected>>", self.on_unit_change)
        
        # Graf-skalning (för inzoomning av y-axel)
        ttk.Label(row1_frame, text="Graf-skala - Min:").pack(side=tk.LEFT, padx=(20,2))
        self.min_entry = ttk.Entry(row1_frame, textvariable=self.process_min, width=6)
        self.min_entry.pack(side=tk.LEFT)
        
        ttk.Label(row1_frame, text="Max:").pack(side=tk.LEFT, padx=(5,2))
        self.max_entry = ttk.Entry(row1_frame, textvariable=self.process_max, width=6)
        self.max_entry.pack(side=tk.LEFT)
        
        # Knapp för att återställa skalning till mätområdet
        ttk.Button(row1_frame, text="Återställ", command=self.reset_scale).pack(side=tk.LEFT, padx=(5,0))
        
        # Knapp för att spara graf-skala ändringar
        ttk.Button(row1_frame, text="Spara", command=self.save_graph_changes).pack(side=tk.LEFT, padx=(5,0))
        
        # Andra raden - Status och export
        row2_frame = ttk.Frame(analysis_frame)
        row2_frame.pack(fill=tk.X, padx=5, pady=2)
        
        # Status-label för att visa aktuella procent-värden
        self.percent_status_label = ttk.Label(row2_frame, text="", font=("Arial", 9))
        self.percent_status_label.pack(side=tk.LEFT, padx=5)

        # Formler/resultat i egen ruta
        formula_frame = ttk.LabelFrame(frame, text="Formler och mellanresultat")
        formula_frame.pack(fill=tk.X, padx=5, pady=5)
        self.formel_label = ttk.Label(formula_frame, text="")
        self.formel_label.pack(fill=tk.X, padx=5, pady=5)

        # Prestandamått i egen ruta
        self.perf_frame = ttk.LabelFrame(frame, text="Prestandamått")
        self.perf_frame.pack(fill=tk.X, padx=5, pady=5)
        self.perf_labels = []
        for i in range(4):
            lbl = ttk.Label(self.perf_frame, text="", font=("Arial", 10))
            lbl.pack(anchor="w", padx=5)
            self.perf_labels.append(lbl)

        # Simulering (flyttad längst ner)
        sim_frame = ttk.LabelFrame(frame, text="Simulering")
        sim_frame.pack(fill=tk.X, padx=5, pady=5, side=tk.BOTTOM)
        self.start_btn = ttk.Button(sim_frame, text="Kör", command=self.start)
        self.start_btn.pack(side=tk.LEFT, padx=2)
        self.pause_btn = ttk.Button(sim_frame, text="Paus", command=self.pause)
        self.pause_btn.pack(side=tk.LEFT, padx=2)
        self.step_btn = ttk.Button(sim_frame, text="Stega", command=self.step_once)
        self.step_btn.pack(side=tk.LEFT, padx=2)
        self.reset_btn = ttk.Button(sim_frame, text="Återställ", command=self.reset)
        self.reset_btn.pack(side=tk.LEFT, padx=2)
        
        ttk.Checkbutton(sim_frame, text="Autopaus", variable=self.autopause_var).pack(side=tk.LEFT, padx=10)
        
        # Hastighetskontroller
        ttk.Label(sim_frame, text="Hastighet:").pack(side=tk.LEFT, padx=(20,2))
        speed_frame = ttk.Frame(sim_frame)
        speed_frame.pack(side=tk.LEFT, padx=5)
        ttk.Button(speed_frame, text="<<", command=self.speed_slower, width=3).pack(side=tk.LEFT)
        ttk.Button(speed_frame, text=">>", command=self.speed_faster, width=3).pack(side=tk.LEFT)
        self.speed_label = ttk.Label(speed_frame, text="1x", width=4)
        self.speed_label.pack(side=tk.LEFT, padx=2)

        # Tidsfönster (flyttad längst ner)
        window_frame = ttk.LabelFrame(frame, text="Tidsfönster")
        window_frame.pack(fill=tk.X, padx=5, pady=5, side=tk.BOTTOM)
        ttk.Radiobutton(window_frame, text="Visa allt", variable=self.window_mode, value="all", command=self.update_plot).pack(side=tk.LEFT)
        ttk.Radiobutton(window_frame, text="Visa fönster", variable=self.window_mode, value="window", command=self.update_plot).pack(side=tk.LEFT)
        ttk.Label(window_frame, text="Fönsterstorlek:").pack(side=tk.LEFT)
        ttk.Entry(window_frame, textvariable=self.window_size, width=4).pack(side=tk.LEFT)
        ttk.Button(window_frame, text="<", command=self.window_back).pack(side=tk.LEFT, padx=2)
        ttk.Button(window_frame, text=">", command=self.window_forward).pack(side=tk.LEFT, padx=2)
        
        # Skapa en container för grafer och export-knappar (i simulator-fliken)
        graph_container = ttk.Frame(self.simulator_frame)
        graph_container.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Skapa huvudlayout för grafer och legend
        main_graph_frame = ttk.Frame(graph_container)
        main_graph_frame.pack(fill=tk.BOTH, expand=True)
        
        # Plott (vänstra sidan)
        plot_frame = ttk.Frame(main_graph_frame)
        plot_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        self.fig, self.axs = plt.subplots(3, 1, sharex=True, figsize=(7,6))
        self.canvas = FigureCanvasTkAgg(self.fig, master=plot_frame)
        # Koppla musrörelse till canvas (måste ske efter att self.canvas skapats)
        self.canvas.mpl_connect('motion_notify_event', self.on_mouse_move)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        
        # Legend-område (högra sidan)
        self.legend_frame = ttk.LabelFrame(main_graph_frame, text="Jämförelse-historik", padding=10)
        self.legend_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(10, 0))
        
        # Historik-knappar (högst upp till vänster)
        history_buttons_frame = ttk.Frame(self.legend_frame)
        history_buttons_frame.pack(side=tk.TOP, fill=tk.X, pady=(0, 10))
        
        self.save_btn = ttk.Button(history_buttons_frame, text="Spara", command=self.save_to_history_dialog)
        self.save_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.clear_history_btn = ttk.Button(history_buttons_frame, text="Rensa historik", command=self.clear_history_dialog)
        self.clear_history_btn.pack(side=tk.LEFT)
        
        # Scrollbar för legend om det blir många simuleringar
        legend_canvas = tk.Canvas(self.legend_frame, width=250, height=400)
        legend_scrollbar = ttk.Scrollbar(self.legend_frame, orient="vertical", command=legend_canvas.yview)
        self.legend_content_frame = ttk.Frame(legend_canvas)
        
        legend_canvas.configure(yscrollcommand=legend_scrollbar.set)
        legend_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        legend_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Bind mousewheel till legend scrolling
        def on_legend_mousewheel(event):
            legend_canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        legend_canvas.bind("<MouseWheel>", on_legend_mousewheel)
        
        # Lägg legend_content_frame i canvas
        legend_canvas.create_window((0, 0), window=self.legend_content_frame, anchor="nw")
        
        # Uppdatera scroll region när innehållet ändras
        def configure_legend_scroll(event):
            legend_canvas.configure(scrollregion=legend_canvas.bbox("all"))
        self.legend_content_frame.bind("<Configure>", configure_legend_scroll)

        # Export-knappar under graferna
        export_frame = ttk.Frame(graph_container)
        export_frame.pack(fill=tk.X, pady=5)
        ttk.Button(export_frame, text="Exportera grafer", command=self.export_plots).pack(side=tk.RIGHT, padx=5)
        ttk.Button(export_frame, text="Spara data", command=self.export_data).pack(side=tk.RIGHT, padx=5)
        
        # Sätt initiala tillstånd för synlighet
        self.on_preset_change()  # Sätt korrekt synlighet för regulator-kontroller
        self.on_disturbance_change()  # Sätt korrekt synlighet för störningskontroller
        self.on_integrerande_change()  # Sätt korrekt synlighet för utflöde
        
        # Skapa hjälp-innehåll
        self.create_help_content()
        
        # Skapa teori-innehåll
        self.create_theory_content()
        
        # Skapa tooltips för viktiga fält
        self.create_tooltips()
        
        # Initiera legend-innehåll
        self.update_legend_display()

    def update_legend_display(self):
        """Uppdaterar legend-området med information om aktuella och historiska simuleringar"""
        # Rensa befintligt innehåll
        for widget in self.legend_content_frame.winfo_children():
            widget.destroy()
        
        if not self.simulation_history:
            # Ingen historik - visa nuvarande simulering ändå
            current_frame = ttk.LabelFrame(self.legend_content_frame, text="Nuvarande", padding=5)
            current_frame.pack(fill=tk.X, pady=5)
            
            # Hämta nuvarande parametrar
            preset = self.preset_mode.get()
            if preset == 'OnOff':
                hyst_type = self.onoff_hysteresis_type.get()
                hyst_high = self.parse_float(self.onoff_hysteresis_high)
                hyst_low = self.parse_float(self.onoff_hysteresis_low)
                current_text = f"OnOff: {hyst_type}\nHyst: +{hyst_high:.1f}/-{hyst_low:.1f}"
            else:
                kp = self.parse_float(self.kp_var)
                ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0
                td = self.parse_float(self.td_var) if self.d_active_var.get() else 0
                
                if preset == 'P':
                    current_text = f"P: Kp={kp:.1f}"
                elif preset == 'PI':
                    current_text = f"PI: Kp={kp:.1f}, Ti={ti:.1f}"
                else:  # PID
                    current_text = f"PID: Kp={kp:.1f}, Ti={ti:.1f}, Td={td:.1f}"
            
            # Lägg till utsignalgränser för alla typer
            u_min = self.parse_float(self.u_min_var)
            u_max = self.parse_float(self.u_max_var)
            current_text += f"\nUt: {u_min:.0f}-{u_max:.0f}%"
            
            ttk.Label(current_frame, text=current_text, font=('TkDefaultFont', 9, 'bold')).pack()
            
            # Använd samma färgsystem som plotting
            plot_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]  # C0-C4
            current_color = plot_colors[self.next_color_id % len(plot_colors)]
            ttk.Label(current_frame, text="●", foreground=current_color, font=('TkDefaultFont', 12)).pack()
            
            # Informationstext
            ttk.Label(self.legend_content_frame, 
                     text="\nÄndra regulatorparametrar och tryck 'Spara' för att skapa jämförelser.",
                     wraplength=220,
                     font=('TkDefaultFont', 9)).pack(pady=10)
            return
        
        # Visa nuvarande simulering först
        current_frame = ttk.LabelFrame(self.legend_content_frame, text="Nuvarande", padding=5)
        current_frame.pack(fill=tk.X, pady=5)
        
        # Hämta nuvarande parametrar
        preset = self.preset_mode.get()
        if preset == 'OnOff':
            hyst_type = self.onoff_hysteresis_type.get()
            hyst_high = self.parse_float(self.onoff_hysteresis_high)
            hyst_low = self.parse_float(self.onoff_hysteresis_low)
            current_text = f"OnOff: {hyst_type}\nHyst: +{hyst_high:.1f}/-{hyst_low:.1f}"
        else:
            kp = self.parse_float(self.kp_var)
            ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0
            td = self.parse_float(self.td_var) if self.d_active_var.get() else 0
            
            if preset == 'P':
                current_text = f"P: Kp={kp:.1f}"
            elif preset == 'PI':
                current_text = f"PI: Kp={kp:.1f}, Ti={ti:.1f}"
            else:  # PID
                current_text = f"PID: Kp={kp:.1f}, Ti={ti:.1f}, Td={td:.1f}"
        
        # Lägg till utsignalgränser för alla typer
        u_min = self.parse_float(self.u_min_var)
        u_max = self.parse_float(self.u_max_var)
        current_text += f"\nUt: {u_min:.0f}-{u_max:.0f}%"
        
        ttk.Label(current_frame, text=current_text, font=('TkDefaultFont', 9, 'bold')).pack()
        
        # Använd samma färgsystem som plotting
        plot_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]  # C0-C4
        current_color = plot_colors[self.next_color_id % len(plot_colors)]
        ttk.Label(current_frame, text="●", foreground=current_color, font=('TkDefaultFont', 12)).pack()
        
        # Visa historiska simuleringar 
        history_frame = ttk.LabelFrame(self.legend_content_frame, text="Tidigare plottar", padding=5)
        history_frame.pack(fill=tk.X, pady=5)
        
        # Matplotlib standard färger som matchar plotting (samma ordning som plottarna)
        plot_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]  # matplotlib C0-C4
        alpha_values = [0.3, 0.4, 0.5, 0.6, 0.7]  # Samma som i plottning
        
        for i, simulation in enumerate(self.simulation_history):
            params = simulation['params']
            
            # Använd det permanenta färg-ID istället för nuvarande position
            color_id = params.get('color_id')
            if color_id is None:
                # Fallback för äldre simuleringar utan color_id - tilldela baserat på ordning
                color_id = i
                params['color_id'] = color_id
            base_color = plot_colors[color_id % len(plot_colors)]
            alpha = alpha_values[min(i, len(alpha_values) - 1)]
            
            # Konvertera till RGB för alpha-simulering
            rgb = mcolors.to_rgb(base_color)
            # Simulera alpha genom att blanda med vit bakgrund
            blended_rgb = [rgb[j] * alpha + (1 - alpha) for j in range(3)]
            color_hex = "#{:02x}{:02x}{:02x}".format(
                int(blended_rgb[0] * 255),
                int(blended_rgb[1] * 255), 
                int(blended_rgb[2] * 255)
            )
            
            sim_frame = ttk.Frame(history_frame)
            sim_frame.pack(fill=tk.X, pady=2)
            
            # Vänster del: färgindikator och huvudtext
            left_frame = ttk.Frame(sim_frame)
            left_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)
            
            # Höger del: raderingsknapp
            right_frame = ttk.Frame(sim_frame)
            right_frame.pack(side=tk.RIGHT)
            
            # Skapa detaljerad parametertext
            # Visa alltid tekniska parametrar, custom_name som extra etikett
            custom_name = params.get('custom_name')
            
            preset = params.get('preset', 'PID')
            if preset == 'OnOff':
                hyst_type = params.get('onoff_hysteresis_type', 'both')
                hyst_high = params.get('onoff_hysteresis_high', 0)
                hyst_low = params.get('onoff_hysteresis_low', 0)
                param_text = f"OnOff: {hyst_type}\nHyst: +{hyst_high:.1f}/-{hyst_low:.1f}"
            else:
                kp = params.get('Kp', 0)
                ti = params.get('Ti', 0)
                td = params.get('Td', 0)
                if preset == 'P':
                    param_text = f"P: Kp={kp:.1f}"
                elif preset == 'PI':
                    param_text = f"PI: Kp={kp:.1f}, Ti={ti:.1f}"
                else:  # PID
                    param_text = f"PID: Kp={kp:.1f}, Ti={ti:.1f}, Td={td:.1f}"
            
            # Lägg alltid till utsignalgränser
            u_min = params.get('u_min', 0)
            u_max = params.get('u_max', 100)
            param_text += f"\nUt: {u_min:.0f}-{u_max:.0f}%"
            
            # Färgindikator och text
            indicator_frame = ttk.Frame(left_frame)
            indicator_frame.pack(side=tk.TOP, anchor=tk.W)
            
            color_label = tk.Label(indicator_frame, text="●", foreground=color_hex, font=('TkDefaultFont', 10))
            color_label.pack(side=tk.LEFT)
            
            param_label = ttk.Label(indicator_frame, text=param_text, font=('TkDefaultFont', 8), justify=tk.LEFT)
            param_label.pack(side=tk.LEFT, padx=(5, 0))
            
            # Visa custom_name som extra etikett om det finns
            if custom_name:
                custom_label = ttk.Label(left_frame, text=f"[{custom_name}]", 
                                       font=('TkDefaultFont', 8, 'italic'), 
                                       foreground='blue')
                custom_label.pack(side=tk.TOP, anchor=tk.W, padx=(15, 0))
            
            # Raderingsknapp
            delete_btn = ttk.Button(right_frame, text="✕", width=3, 
                                  command=lambda idx=i: self.remove_simulation_from_history(idx))
            delete_btn.pack()
        
        # Uppdatera scroll region
        self.legend_content_frame.update_idletasks()
        legend_canvas = self.legend_content_frame.master
        legend_canvas.configure(scrollregion=legend_canvas.bbox("all"))

    def create_tooltips(self):
        """Skapar tooltips för alla viktiga widgets"""
        # Regulatorparametrar
        ToolTip(self.kp_entry, HELP_TEXTS["kp"])
        ToolTip(self.ti_entry, HELP_TEXTS["ti"])
        ToolTip(self.td_entry, HELP_TEXTS["td"])
        ToolTip(self.sp_entry, HELP_TEXTS["setpoint"])
        
        # Systemparametrar
        ToolTip(self.proc_k_entry, HELP_TEXTS["process_k"])
        ToolTip(self.proc_t_label, HELP_TEXTS["process_t"])
        ToolTip(self.proc_t_entry, HELP_TEXTS["process_t"])
        ToolTip(self.proc_dead_entry, HELP_TEXTS["process_dead"])
        ToolTip(self.nv_entry, HELP_TEXTS["normalvarde"])
        
        # Mätområde
        ToolTip(self.matområde_min_entry, HELP_TEXTS["matområde_min"])
        ToolTip(self.matområde_max_entry, HELP_TEXTS["matområde_max"])
        
        # Utsignal-begränsningar
        ToolTip(self.u_min_entry, HELP_TEXTS["umin"])
        ToolTip(self.u_max_entry, HELP_TEXTS["umax"])
        
        # OnOff-specifika kontroller
        ToolTip(self.onoff_high_entry, HELP_TEXTS["hysteresis_high"])
        ToolTip(self.onoff_low_entry, HELP_TEXTS["hysteresis_low"])
        
        # Graf-skala
        ToolTip(self.min_entry, HELP_TEXTS["graf_skala"])
        ToolTip(self.max_entry, HELP_TEXTS["graf_skala"])
        
        # Manual output
        ToolTip(self.manual_entry, HELP_TEXTS["manual_out"])
        
        # Visa i procent checkbox
        ToolTip(self.percent_mode_check, HELP_TEXTS["percent_mode"])
        
        # Checkboxes och viktiga val
        for widget in self.root.winfo_children():
            self._add_tooltips_recursive(widget)
    
    def _add_tooltips_recursive(self, widget):
        """Hjälpmetod för att hitta widgets rekursivt och lägga till tooltips"""
        widget_text = ""
        try:
            if hasattr(widget, 'cget'):
                widget_text = widget.cget('text').lower()
        except:
            pass
            
        # Lägg till tooltips baserat på widget-text
        if 'anti-windup' in widget_text:
            ToolTip(widget, HELP_TEXTS["antiwindup"])
        elif 'manuellt läge' in widget_text:
            ToolTip(widget, HELP_TEXTS["manuellt"])
        elif 'enhetslös k' in widget_text:
            ToolTip(widget, HELP_TEXTS["enhetslös_k"])
        elif 'integrerande' in widget_text:
            ToolTip(widget, HELP_TEXTS["integrerande"])
        elif 'signalstörning' in widget_text:
            ToolTip(widget, HELP_TEXTS["signalstörning"])
        elif 'exportera grafer' in widget_text:
            ToolTip(widget, HELP_TEXTS["export_graf"])
        elif 'spara data' in widget_text:
            ToolTip(widget, HELP_TEXTS["export_data"])
        elif 'över börvärdet' in widget_text:
            ToolTip(widget, "Hysteresis tillämpas endast över börvärdet - processen stängs av när den överskrider börvärdet + hysteresis.")
        elif 'under börvärdet' in widget_text:
            ToolTip(widget, "Hysteresis tillämpas endast under börvärdet - processen startas när den underskrider börvärdet - hysteresis.")
        elif 'båda sidorna' in widget_text:
            ToolTip(widget, "Hysteresis tillämpas på båda sidorna av börvärdet för maximal stabilitet.")
        elif any(preset in widget_text for preset in ['on/off', 'p-reglering', 'pi-reglering', 'pid-reglering']):
            ToolTip(widget, HELP_TEXTS["preset"])
            
        # Rekursivt genom alla barn-widgets
        for child in widget.winfo_children():
            self._add_tooltips_recursive(child)

    def create_help_content(self):
        """Skapar hjälpinnehållet i hjälp-fliken"""
        # Scrollbar för hjälptext
        help_canvas = tk.Canvas(self.help_frame)
        help_scrollbar = ttk.Scrollbar(self.help_frame, orient="vertical", command=help_canvas.yview)
        help_content_frame = ttk.Frame(help_canvas)
        
        help_content_frame.bind(
            "<Configure>",
            lambda e: help_canvas.configure(scrollregion=help_canvas.bbox("all"))
        )
        
        help_canvas.create_window((0, 0), window=help_content_frame, anchor="nw")
        help_canvas.configure(yscrollcommand=help_scrollbar.set)
        
        help_canvas.pack(side="left", fill="both", expand=True)
        help_scrollbar.pack(side="right", fill="y")
        
        # Läs hjälpfil om den finns
        help_file_path = resource_path("help.md")
        help_content = ""
        
        try:
            with open(help_file_path, 'r', encoding='utf-8') as f:
                help_content = f.read()
                # Ta bort alla potentiellt problematiska unicode-tecken
                import re
                help_content = re.sub(r'[^\u0000-\uFFFF]', '', help_content)
        except FileNotFoundError:
            help_content = "# Hjälpfil hittades inte\n\nAnvänd tooltips genom att hovra över fält för snabb hjälp."
        
        # Enkel markdown-parsing för visning
        self.display_markdown(help_content_frame, help_content)
        
        # Bind mushjul till scrollning - behöver bindas till alla widgets
        def _on_mousewheel(event):
            help_canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        # Rekursiv binding av mushjul till alla widgets i hjälp-framen
        def bind_mousewheel_recursive(widget):
            widget.bind("<MouseWheel>", _on_mousewheel)
            for child in widget.winfo_children():
                bind_mousewheel_recursive(child)
        
        bind_mousewheel_recursive(self.help_frame)
        
    def create_theory_content(self):
        """Skapar teoriinnehållet i teori-fliken"""
        # Scrollbar för teoritext
        theory_canvas = tk.Canvas(self.theory_frame)
        theory_scrollbar = ttk.Scrollbar(self.theory_frame, orient="vertical", command=theory_canvas.yview)
        theory_content_frame = ttk.Frame(theory_canvas)
        
        theory_content_frame.bind(
            "<Configure>",
            lambda e: theory_canvas.configure(scrollregion=theory_canvas.bbox("all"))
        )
        
        theory_canvas.create_window((0, 0), window=theory_content_frame, anchor="nw")
        theory_canvas.configure(yscrollcommand=theory_scrollbar.set)
        
        theory_canvas.pack(side="left", fill="both", expand=True)
        theory_scrollbar.pack(side="right", fill="y")
        
        # Läs teorifil om den finns
        theory_file_path = resource_path("teori-och-bakgrund.md")
        theory_content = ""
        
        try:
            with open(theory_file_path, 'r', encoding='utf-8') as f:
                theory_content = f.read()
                # Ta bort alla potentiellt problematiska unicode-tecken
                import re
                theory_content = re.sub(r'[^\u0000-\uFFFF]', '', theory_content)
        except FileNotFoundError:
            theory_content = "# Teorifil hittades inte\n\nTeoridokumentet (teori-och-bakgrund.md) kunde inte hittas."
        
        # Enkel markdown-parsing för visning
        self.display_markdown(theory_content_frame, theory_content)
        
        # Bind mushjul till scrollning
        def _on_mousewheel_theory(event):
            theory_canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        # Rekursiv binding av mushjul till alla widgets i teori-framen
        def bind_mousewheel_recursive_theory(widget):
            widget.bind("<MouseWheel>", _on_mousewheel_theory)
            for child in widget.winfo_children():
                bind_mousewheel_recursive_theory(child)
        
        bind_mousewheel_recursive_theory(self.theory_frame)
        
    def display_markdown(self, parent, markdown_text):
        """Enkel markdown-renderer för hjälptext"""
        lines = markdown_text.split('\n')
        in_code_block = False
        
        for line in lines:
            original_line = line
            line = line.strip()
            
            if not line:
                # Tom rad
                ttk.Label(parent, text="").pack(anchor="w", pady=2)
                continue
            
            # Hantera kodblock
            if line.startswith('```'):
                in_code_block = not in_code_block
                if not in_code_block:
                    # Avsluta kodblock med extra mellanrum
                    ttk.Label(parent, text="").pack(anchor="w", pady=2)
                continue
            
            if in_code_block:
                # Kodrad - visa med monospace-font, vänsterjusterad
                label = tk.Label(parent, text=original_line, font=("Courier New", 9), 
                               bg="#f5f5f5", fg="darkblue", justify="left", anchor="w")
                label.pack(anchor="w", pady=1, padx=20)
                continue
            
            if line.startswith('# '):
                # Huvudrubrik
                title = line[2:]
                label = tk.Label(parent, text=title, font=("Arial", 16, "bold"), fg="blue")
                label.pack(anchor="w", pady=(10, 5))
                
            elif line.startswith('## '):
                # Underrubrik
                subtitle = line[3:]
                label = tk.Label(parent, text=subtitle, font=("Arial", 14, "bold"), fg="darkblue")
                label.pack(anchor="w", pady=(8, 3))
                
            elif line.startswith('### '):
                # Mindre rubrik
                subsubtitle = line[4:]
                label = tk.Label(parent, text=subsubtitle, font=("Arial", 12, "bold"), fg="darkgreen")
                label.pack(anchor="w", pady=(5, 2))
                
            elif line.startswith('#### '):
                # Minsta rubrik
                small_title = line[5:]
                label = tk.Label(parent, text=small_title, font=("Arial", 10, "bold"), fg="darkred")
                label.pack(anchor="w", pady=(3, 1))
                
            elif line.startswith('- ') or line.startswith('* '):
                # Listpunkt (hantera fetstil inom listpunkter)
                bullet_text = line[2:]
                self.create_mixed_text_label(parent, f"• {bullet_text}", padx=20, pady=1)
                
            elif '**' in line or '*' in line:
                # Fetstil eller kursiv (hantera blandad text)
                self.create_mixed_text_label(parent, line, padx=0, pady=1)
                
            else:
                # Vanlig text
                label = tk.Label(parent, text=line, wraplength=700, justify="left", font=("Arial", 9))
                label.pack(anchor="w", pady=1)

    def is_mathematical_expression(self, line):
        """Identifierar om en rad innehåller matematiska uttryck"""
        # Enkel regel: Kodblock (```) hanteras redan av markdown-renderaren
        # Ingen ytterligare identifiering behövs - låt kodblock vara matematik
        return False

    def create_mixed_text_label(self, parent, text, padx=0, pady=1):
        """Skapar en label med blandad text (normal + fetstil + kursiv)"""
        # Skapa en frame för att hålla text-delar
        text_frame = tk.Frame(parent)
        text_frame.pack(anchor="w", padx=padx, pady=pady, fill="x")
        
        current_row = tk.Frame(text_frame)
        current_row.pack(anchor="w", fill="x")
        
        # Använd alltid Arial för vanlig text med formatering
        base_font_family = "Arial"
        
        # Enkel parsing av markdown-formatering
        import re
        
        # Hantera både ** och * formatering
        # Först dela på ** för fetstil
        parts = text.split('**')
        
        for i, part in enumerate(parts):
            if not part:
                continue
                
            if i % 2 == 1:  # Udda index = fetstil
                font = (base_font_family, 9, "bold")
                label = tk.Label(current_row, text=part, font=font)
                label.pack(side="left")
            else:
                # Hantera kursiv inom normal text
                italic_parts = part.split('*')
                for j, italic_part in enumerate(italic_parts):
                    if not italic_part:
                        continue
                    
                    if j % 2 == 1:  # Udda index = kursiv
                        font = (base_font_family, 9, "italic")
                    else:  # Jämn index = normal text
                        font = (base_font_family, 9)
                    
                    # Hantera radbrytningar
                    if '\n' in italic_part:
                        lines = italic_part.split('\n')
                        for k, line_part in enumerate(lines):
                            if line_part:
                                label = tk.Label(current_row, text=line_part, font=font)
                                label.pack(side="left")
                            if k < len(lines) - 1:  # Inte sista delen
                                current_row = tk.Frame(text_frame)
                                current_row.pack(anchor="w", fill="x")
                    else:
                        label = tk.Label(current_row, text=italic_part, font=font)
                        label.pack(side="left")

    def trigger_pulse(self):
        # Aktivera puls-störning
        self.pulse_active = True
        self.pulse_steps_left = self.pulse_dur_var.get()

    def on_enhetslös_K_change(self):
        """Hanterar växling till/från enhetslös K"""
        # Uppdatera process-objektet med nya inställningar
        if not self.running:
            self.process.enhetslös_K = self.enhetslös_K_var.get()
            self.process.matområde_min = self.parse_float(self.matområde_min_var)
            self.process.matområde_max = self.parse_float(self.matområde_max_var)
            # Uppdatera K-label för att visa enhet
            self.update_k_label()
    
    def update_k_label(self):
        """Uppdaterar K-etiketten baserat på enhetslös K-inställning"""
        # Detta skulle kunna implementeras för att visa K-enhet
        pass

    def speed_faster(self):
        # Logaritmisk hastighetsändring med 1.5x multiplikator (minska delay = öka hastighet)
        # Delay-värden sorterade från långsam till snabb
        speed_levels = [1800, 1200, 750, 430, 300, 200, 150, 100, 60, 40, 27, 18, 12, 8, 5]
        current = self.speed_var.get()
        
        # Hitta nuvarande position eller närmaste position
        current_index = -1
        
        # Första försök: hitta exakt match
        for i, level in enumerate(speed_levels):
            if current == level:
                current_index = i
                break
        
        # Om exakt match, gå till nästa snabbare nivå
        if current_index >= 0:
            if current_index < len(speed_levels) - 1:  # Inte redan snabbast
                self.speed_var.set(speed_levels[current_index + 1])
        else:
            # Om ingen exakt match, hitta rätt position att hoppa till
            for i, level in enumerate(speed_levels):
                if current > level:
                    self.speed_var.set(level)
                    break
        
        self.update_speed_label()

    def speed_slower(self):
        # Logaritmisk hastighetsändring med 1.5x multiplikator (öka delay = minska hastighet)
        speed_levels = [1800, 1200, 750, 430, 300, 200, 150, 100, 60, 40, 27, 18, 12, 8, 5]
        current = self.speed_var.get()
        
        # Hitta nuvarande position eller närmaste position
        current_index = -1
        
        # Första försök: hitta exakt match
        for i, level in enumerate(speed_levels):
            if current == level:
                current_index = i
                break
        
        # Om exakt match, gå till nästa långsammare nivå
        if current_index >= 0:
            if current_index > 0:  # Inte redan långsammast
                self.speed_var.set(speed_levels[current_index - 1])
        else:
            # Om ingen exakt match, hitta rätt position att hoppa till
            for i in range(len(speed_levels) - 1, -1, -1):
                if current < speed_levels[i]:
                    self.speed_var.set(speed_levels[i])
                    break
        
        self.update_speed_label()

    def update_speed_label(self):
        # Hastighetsvisning med 1.5x multiplikator baserat på 300ms = 1x
        delay = self.speed_var.get()
        
        # Exakta mappningar för de förutbestämda nivåerna
        speed_map = {
            1800: "0.17x", 1200: "0.25x", 750: "0.4x", 430: "0.7x", 
            300: "1x", 200: "1.5x", 150: "2x", 100: "3x", 
            60: "5x", 40: "7.5x", 27: "11x", 18: "17x", 
            12: "25x", 8: "38x", 5: "58x"
        }
        
        # Använd exakt mappning om tillgänglig
        if delay in speed_map:
            self.speed_label.config(text=speed_map[delay])
        else:
            # Fallback: beräkna baserat på 300ms = 1x
            speed_factor = 300 / delay
            if speed_factor >= 1:
                self.speed_label.config(text=f"{speed_factor:.1f}x")
            else:
                self.speed_label.config(text=f"{speed_factor:.2f}x")

    def parse_float(self, var):
        try:
            return float(str(var.get()).replace(",", "."))
        except Exception:
            return 0.0

    def setup_numeric_input_handling(self):
        """Sätter upp hantering av decimal comma för alla numeriska inmatningsfält"""
        # Lista över alla numeriska Entry-widgets och deras motsvarande tkinter-variabler
        self.numeric_fields = [
            (self.sp_entry, self.sp_var),
            (self.nv_entry, self.nv_var),
            (self.kp_entry, self.kp_var),
            (self.ti_entry, self.ti_var),
            (self.td_entry, self.td_var),
            (self.matområde_min_entry, self.matområde_min_var),
            (self.matområde_max_entry, self.matområde_max_var),
            (self.u_min_entry, self.u_min_var),
            (self.u_max_entry, self.u_max_var),
            (self.proc_k_entry, self.proc_k_var),
            (self.proc_t_entry, self.proc_t_var),
            (self.proc_dead_entry, self.proc_dead_var),
            (self.utflode_entry, self.proc_fout_var),
            (self.noise_entry, self.noise_std_var),
            (self.pulse_entry, self.pulse_mag_var),
            (self.manual_entry, self.manual_output_var),
            (self.min_entry, self.process_min),
            (self.max_entry, self.process_max),
        ]
        
        # Lägg till Entry-widgets för hysteresis och andra fält om de existerar
        if hasattr(self, 'onoff_high_entry'):
            self.numeric_fields.append((self.onoff_high_entry, self.onoff_hysteresis_high))
        if hasattr(self, 'onoff_low_entry'):
            self.numeric_fields.append((self.onoff_low_entry, self.onoff_hysteresis_low))
        
        # Bind events för alla numeriska fält
        for entry_widget, var in self.numeric_fields:
            if entry_widget and var:
                # Bind händelser för komma-till-punkt-konvertering
                entry_widget.bind('<FocusOut>', lambda event, w=entry_widget, v=var: self.handle_numeric_input(event, w, v))
                entry_widget.bind('<Return>', lambda event, w=entry_widget, v=var: self.handle_numeric_input(event, w, v))
                entry_widget.bind('<KP_Enter>', lambda event, w=entry_widget, v=var: self.handle_numeric_input(event, w, v))

    def handle_numeric_input(self, event, entry_widget, tk_var):
        """Hanterar numerisk input genom att konvertera decimal comma och sätta tkinter-variabeln"""
        try:
            # Hämta det råa värdet från Entry-widgeten
            raw_value = entry_widget.get()
            # Konvertera decimal comma till decimal punkt
            normalized_value = raw_value.replace(",", ".")
            # Försök konvertera till float för validering
            float_value = float(normalized_value)
            # Sätt det normaliserade värdet i tkinter-variabeln
            # Detta fungerar även för DoubleVar eftersom vi ger den en giltig float
            tk_var.set(float_value)
            # Uppdatera Entry-widgeten för att visa det normaliserade värdet
            entry_widget.delete(0, tk.END)
            entry_widget.insert(0, f"{float_value:.6g}")
        except (ValueError, AttributeError):
            # Om konvertering misslyckas, behåll ursprungligt värde
            pass

    def validate_T_value(self, show_warning=True):
        """Validerar T-värdet och visar varning om det är <= 0"""
        dt = 1.0  # Simuleringssteg, hårdkodat i denna version
        T_min = dt
        T_value = self.parse_float(self.proc_t_var)
        if T_value < T_min:
            self.proc_t_var.set(str(T_min))
            if show_warning:
                import tkinter.messagebox as msgbox
                msgbox.showerror(
                    "Felaktig tidskonstant",
                    f"Tidskonstanten T måste vara minst dt = {dt} sekund(er) för stabil simulering.\n"
                    f"Simuleringen har stoppats och T har satts till {T_min}.\n\n"
                    "För snabba system (liten T) krävs mindre tidssteg dt.\n"
                    "Vill du simulera ännu snabbare system, kontakta utvecklaren för att göra dt justerbar."
                )
            return T_min
        return T_value

    def window_back(self):
        if self.window_mode.get() == "window":
            size = self.parse_float(self.window_size)
            step = max(1, int(size * 0.2))
            self.window_start = max(0, self.window_start - step)
            self.update_plot()

    def window_forward(self):
        if self.window_mode.get() == "window":
            size = self.parse_float(self.window_size)
            step = max(1, int(size * 0.2))
            max_start = max(0, len(self.t) - int(size))
            self.window_start = min(max_start, self.window_start + step)
            self.update_plot()

    def set_setpoint(self):
        # Hantera svenska decimalkomma
        try:
            self.setpoint = self.parse_float(self.sp_var)
            # Normalisera fältet till decimal punkt
            self.sp_var.set(f"{self.setpoint:.6g}")
        except Exception:
            self.setpoint = 0.0

    def set_nv(self):
        # Hantera svenska decimalkomma för normalvärde
        try:
            # Create a temporary StringVar to use with parse_float
            temp_var = tk.StringVar(value=self.nv_entry.get())
            nv = self.parse_float(temp_var)
            self.nv_var.set(f"{nv:.6g}")  # Normalisera till decimal punkt
        except Exception:
            nv = 23.0
        # Uppdatera processens normalvärde direkt
        self.process.normalvarde = self.parse_float(self.nv_var)
        # Uppdatera även startvärdet och historiken om vi inte är mitt i en simulering
        if not self.running:
            self.process.y = self.parse_float(self.nv_var)
            # Uppdatera hela dötidshistoriken med nya normalvärdet
            self.process.y_hist = [self.parse_float(self.nv_var)] * len(self.process.y_hist)
            # Uppdatera den första punkten i plot-historiken
        self.update_plot()

    def on_manual_mode_change(self):
        """Aktivera/inaktivera manuell kontroll"""
        if self.manual_mode_var.get():
            self.manual_entry.configure(state="normal")
        else:
            self.manual_entry.configure(state="disabled")
        # Uppdatera plotten direkt när manuellt läge växlas
        self.update_plot()
    
    def on_preset_change(self):
        """Hanterar växling mellan regulator-presets"""
        # Spara nuvarande simulering till historik INNAN vi ändrar parametrarna
        # Använd den sparade preset-typen som faktiskt användes för simuleringen
        if len(self.t) > 10:
            old_params = {
                'Kp': self.saved_params['kp'],
                'Ti': self.saved_params['ti'],
                'Td': self.saved_params['td'],
                'preset': self.saved_params.get('preset', 'OnOff'),  # Använd sparad preset
                'onoff_hysteresis_high': self.saved_params.get('onoff_hysteresis_high', 0),
                'onoff_hysteresis_low': self.saved_params.get('onoff_hysteresis_low', 0),
                'onoff_hysteresis_type': self.onoff_hysteresis_type.get(),
                'u_min': self.saved_params.get('u_min', 0),
                'u_max': self.saved_params.get('u_max', 100),
                'color_id': self.next_color_id,  # Permanent färg-ID
                'timestamp': len(self.simulation_history)
            }
            self.save_simulation_to_history(override_params=old_params)
            
        preset = self.preset_mode.get()
        
        if preset == "OnOff":
            # Visa On/Off-kontroller, dölj PID-parametrar och irrelevanta kontroller
            self.onoff_frame.pack(fill=tk.X, padx=5, pady=2)
            self.pid_params_frame.pack_forget()
                
        else:
            # Dölj On/Off-kontroller, visa PID-parametrar
            self.onoff_frame.pack_forget()
            self.pid_params_frame.pack(fill=tk.X, padx=5, pady=2)
            
            # Visa/dölj Ti och Td baserat på preset
            if preset == "P":
                # P-reglering: Visa bara Kp
                self.ti_frame.pack_forget()
                self.td_frame.pack_forget()
                self.kp_var.set("2.0")
                self.ti_var.set("0.0")  # Sätt Ti till 0 (mer pedagogiskt tydligt än 999999)
                self.td_var.set("0.0")
                self.i_active_var.set(False)
                self.d_active_var.set(False)
            elif preset == "PI":
                # PI-reglering: Visa Kp och Ti
                self.ti_frame.pack(side=tk.LEFT)
                self.td_frame.pack_forget()
                self.kp_var.set("2.0")
                self.ti_var.set("10.0")
                self.td_var.set("0.0")
                self.i_active_var.set(True)
                self.d_active_var.set(False)
            elif preset == "PID":
                # PID-reglering: Visa alla parametrar
                self.ti_frame.pack(side=tk.LEFT)
                self.td_frame.pack(side=tk.LEFT)
                self.kp_var.set("2.0")
                self.ti_var.set("10.0")
                self.td_var.set("1.0")
                self.i_active_var.set(True)
                self.d_active_var.set(True)
        
        # Automatiskt spara ändringar vid preset-växling för att nya värden ska träda i kraft direkt
        # (save_to_history=False eftersom vi redan sparade i början av metoden)
        self.save_regulator_changes(save_to_history=False)
        
        # Uppdatera legend-display för att visa nya parametrar direkt
        self.update_legend_display()
        
        # Uppdatera On/Off-regulator
        self.on_onoff_change()
        
    def on_onoff_change(self):
        """Uppdaterar On/Off-regulator type (anropas vid radiobutton ändringar)"""
        # Uppdatera bara typen, inte värden (värden uppdateras vid spara)
        self.onoff_controller.hysteresis_type = self.onoff_hysteresis_type.get()
        
    def on_disturbance_change(self):
        """Aktiverar/inaktiverar signalstörningar och visar/döljer kontroller"""
        enabled = self.signal_disturbance_var.get()
        
        if enabled:
            # Aktivera störningar - sätt till rimliga värden
            self.noise_std_var.set(0.5)
            
            # Visa alla störningswidgets
            for widget in self.disturbance_widgets:
                widget.pack(side=tk.LEFT)
        else:
            # Inaktivera störningar
            self.noise_std_var.set(0.0)
            self.pulse_active = False
            self.pulse_steps_left = 0
            
            # Dölj alla störningswidgets
            for widget in self.disturbance_widgets:
                widget.pack_forget()
    
    def on_integrerande_change(self):
        """Hantera när integrerande-checkbox ändras - visa/dölj utflöde och T-parameter"""
        integrerande = self.integrerande_var.get()
        
        # Rensa simulation historik eftersom processtyp har ändrats
        self.clear_simulation_history()
        
        # Visa/dölj utflöde-kontroller baserat på integrerande-status
        if integrerande:
            self.utflode_label.pack(side=tk.LEFT)
            self.utflode_entry.pack(side=tk.LEFT)
            # Dölj T-parameter för integrerande processer
            self.proc_t_label.pack_forget()
            self.proc_t_entry.pack_forget()
        else:
            self.utflode_label.pack_forget()
            self.utflode_entry.pack_forget()
            # Visa T-parameter för självreglerande processer - sätt in före integrerande-kryssrutan
            self.proc_t_label.pack(side=tk.LEFT, padx=5, before=self.integrerande_check)
            self.proc_t_entry.pack(side=tk.LEFT, padx=5, before=self.integrerande_check)
    
    def on_percent_mode_change(self):
        """Hanterar växling till/från procentvisning"""
        
        # Aktivera ignore-flagga under enhetskonvertering
        self._ignore_changes = True
        
        # Konvertera börvärdet mellan procent och fysiska enheter
        try:
            current_setpoint = self.parse_float(self.sp_var)
        except ValueError:
            current_setpoint = self.setpoint
        
        try:
            if self.percent_mode_var.get():
                # Växla till procentläge: konvertera från fysisk enhet till procent
                # Använd mätområdet för korrekt procentberäkning
                mat_min = self.parse_float(self.matområde_min_var)
                mat_max = self.parse_float(self.matområde_max_var)
                new_setpoint = (current_setpoint - mat_min) / (mat_max - mat_min) * 100
                self.sp_var.set(f"{new_setpoint:.1f}")
                self.sp_unit_label.config(text="%")
            else:
                # Växla från procentläge: konvertera från procent till fysisk enhet
                # Använd mätområdet för korrekt fysisk enhetsberäkning
                mat_min = self.parse_float(self.matområde_min_var)
                mat_max = self.parse_float(self.matområde_max_var)
                new_setpoint = mat_min + (current_setpoint / 100) * (mat_max - mat_min)
                self.sp_var.set(f"{new_setpoint:.1f}")
                self.sp_unit_label.config(text=self.process_unit_var.get())
        except ZeroDivisionError:
            pass  # Undvik division med noll om max == min
        
        # Återaktivera change tracking
        self._ignore_changes = False
        
        # Uppdatera saved_params för alla fält som påverkas av enhetskonvertering
        # så att de nya konverterade värdena betraktas som "sparade"
        try:
            new_setpoint_value = self.parse_float(self.sp_var)
            self.saved_params['setpoint'] = new_setpoint_value
        except ValueError:
            pass
            
        try:
            new_min_value = self.parse_float(self.matområde_min_var)
            self.saved_params['matområde_min'] = new_min_value
        except ValueError:
            pass
            
        try:
            new_max_value = self.parse_float(self.matområde_max_var)
            self.saved_params['matområde_max'] = new_max_value
        except ValueError:
            pass
            
        # Uppdatera även hysteresis-parametrar så de inte blir röda efter enhetskonvertering
        try:
            self.saved_params['onoff_hysteresis_high'] = self.parse_float(self.onoff_hysteresis_high)
            self.saved_params['onoff_hysteresis_low'] = self.parse_float(self.onoff_hysteresis_low)
            self.saved_params['onoff_hysteresis_type'] = self.onoff_hysteresis_type.get()
        except ValueError:
            pass
        
        # Uppdatera highlighting för att säkerställa rätt färger
        self.highlight_unsaved_changes()
        
        self.update_plot()
        self.update_percent_status()
        
    def on_unit_change(self, event=None):
        """Hanterar ändringar av processenhet"""
        # Uppdatera börvärde-etiketten om vi inte är i procentläge
        if not self.percent_mode_var.get():
            self.sp_unit_label.config(text=self.process_unit_var.get())
        self.update_plot()
        
    def on_scale_change(self, *args):
        """Hanterar ändringar av mätområdet (min/max)"""
        # Om vi är i procentläge behöver börvärdet uppdateras när mätområdet ändras
        if self.percent_mode_var.get():
            # Tillfälligt inaktivera change tracking under automatisk konvertering
            self._ignore_changes = True
            
            try:
                # Hämta aktuella mätområdesvärden
                min_val = self.parse_float(self.matområde_min_var)
                max_val = self.parse_float(self.matområde_max_var)
                
                # Konvertera nuvarande setpoint till procent med nya mätområdet
                current_setpoint_physical = self.setpoint  # Detta är det fysiska värdet
                if max_val != min_val:  # Undvik division med noll
                    new_setpoint_percent = (current_setpoint_physical - min_val) / (max_val - min_val) * 100
                    self.sp_var.set(f"{new_setpoint_percent:.1f}")
            except (ValueError, ZeroDivisionError, tk.TclError):
                pass  # Undvik fel vid ogiltiga värden eller division med noll
            
            # Återaktivera change tracking
            self._ignore_changes = False
        
        # Uppdatera grafen efter en kort fördröjning för att undvika spam
        self.root.after(100, self.update_plot)
        
    def update_scale(self):
        """Uppdaterar mätområdet och börvärdet när användaren klickar på Uppdatera-knappen"""
        # Om vi är i procentläge behöver börvärdet uppdateras när mätområdet ändras
        if self.percent_mode_var.get():
            # Tillfälligt inaktivera change tracking under automatisk konvertering
            self._ignore_changes = True
            
            try:
                # Hämta aktuella mätområdesvärden
                min_val = self.parse_float(self.matområde_min_var)
                max_val = self.parse_float(self.matområde_max_var)
                
                # Konvertera nuvarande setpoint till procent med nya mätområdet
                current_setpoint_physical = self.setpoint  # Detta är det fysiska värdet
                if max_val != min_val:  # Undvik division med noll
                    new_setpoint_percent = (current_setpoint_physical - min_val) / (max_val - min_val) * 100
                    self.sp_var.set(f"{new_setpoint_percent:.1f}")
            except (ValueError, ZeroDivisionError, tk.TclError):
                pass  # Undvik fel vid ogiltiga värden eller division med noll
            
            # Återaktivera change tracking
            self._ignore_changes = False
        
        # Uppdatera grafen direkt
        self.update_plot()
        
    def on_measurement_range_change(self, *args):
        """Hanterar ändringar av mätområdet - uppdaterar skalning till samma värden"""
        try:
            # Sätt skalning till samma som mätområdet
            self.process_min.set(self.parse_float(self.matområde_min_var))
            self.process_max.set(self.parse_float(self.matområde_max_var))
        except (ValueError, tk.TclError):
            pass  # Undvik fel vid ogiltiga värden
        
    def setup_change_tracking(self):
        """Sätter upp spårning av ändringar för alla fält i Regulatorparametrar-ramen"""
        # Lista över alla tkinter-variabler i Regulatorparametrar-ramen
        regulator_vars = [
            self.sp_var, self.nv_var, self.kp_var, self.ti_var, self.td_var,
            self.matområde_min_var, self.matområde_max_var, 
            self.proc_k_var, self.proc_t_var, self.proc_dead_var, self.process_unit_var,
            self.i_active_var, self.d_active_var, self.preset_mode,
            self.onoff_hysteresis_high, self.onoff_hysteresis_low,
            self.u_min_var, self.u_max_var,
            self.process_min, self.process_max  # Graf-skala fält
        ]
        
        # Lägg till change callbacks för alla variabler
        for var in regulator_vars:
            var.trace_add('write', self.on_regulator_change)
    
    def on_regulator_change(self, *args):
        """Anropas när någon parameter i Regulatorparametrar-ramen ändras"""
        # Ignorera ändringar under automatiska konverteringar
        if getattr(self, '_ignore_changes', False):
            return
            
        # Kontrollera om något verkligen har ändrats
        if self.has_unsaved_changes():
            self.highlight_unsaved_changes()
        else:
            self.clear_unsaved_highlights()
            
    def clear_unsaved_highlights(self):
        """Återställer alla entry-fält till normal textfärg"""
        # Lista över alla entry-widgets
        entry_widgets = [
            self.sp_entry, self.nv_entry, self.kp_entry, self.ti_entry, self.td_entry,
            self.matområde_min_entry, self.matområde_max_entry,
            self.proc_k_entry, self.proc_t_entry, self.proc_dead_entry,
            self.onoff_high_entry, self.onoff_low_entry
        ]
        
        for widget in entry_widgets:
            try:
                # Återställ till normal svart textfärg
                widget.configure(foreground='black')
            except Exception as e:
                pass

    def highlight_unsaved_changes(self):
        """Markerar endast de fält som faktiskt ändrats med röd textfärg"""
        # Lista över alla entry-widgets och deras motsvarande sparade värden
        widgets_and_params = [
            (self.sp_entry, 'setpoint'),
            (self.nv_entry, 'nv'),
            (self.kp_entry, 'kp'),
            (self.ti_entry, 'ti'),
            (self.td_entry, 'td'),
            (self.matområde_min_entry, 'matområde_min'),
            (self.matområde_max_entry, 'matområde_max'),
            (self.proc_k_entry, 'proc_k'),
            (self.proc_t_entry, 'proc_t'),
            (self.proc_dead_entry, 'proc_dead_time'),
            (self.onoff_high_entry, 'onoff_hysteresis_high'),
            (self.onoff_low_entry, 'onoff_hysteresis_low'),
            (self.u_min_entry, 'u_min'),
            (self.u_max_entry, 'u_max'),
            (self.min_entry, 'graph_min'),
            (self.max_entry, 'graph_max')
        ]
        
        for widget, param_name in widgets_and_params:
            try:
                # Hämta aktuellt värde från widget
                current_value = widget.get().strip()
                # Hämta sparat värde och konvertera till samma format
                saved_value = str(self.saved_params.get(param_name, '')).strip()
                
                # Normalisera värden för jämförelse (hantera float vs string)
                try:
                    # Försök konvertera båda till float för numerisk jämförelse
                    if current_value == '':
                        current_float = 0.0
                    else:
                        # Skapa tillfällig StringVar för att använda parse_float
                        temp_var = tk.StringVar(value=current_value)
                        current_float = self.parse_float(temp_var)
                    saved_float = float(saved_value) if saved_value else 0.0
                    
                    # Jämför som float med en liten tolerans
                    values_equal = abs(current_float - saved_float) < 0.0001
                except ValueError:
                    # Om någon inte kan konverteras till float, jämför som strängar
                    values_equal = current_value == saved_value
                
                if not values_equal:
                    # Värdet har ändrats - röd text
                    widget.configure(foreground='red')
                else:
                    # Värdet är oförändrat - normal text
                    widget.configure(foreground='black')
                    
            except Exception:
                pass

    def has_unsaved_changes(self):
        """Kontrollerar om det finns osparade ändringar"""
        # Lista över alla entry-widgets och deras motsvarande sparade värden
        widgets_and_params = [
            (self.sp_entry, 'setpoint'),
            (self.nv_entry, 'nv'), 
            (self.kp_entry, 'kp'),
            (self.ti_entry, 'ti'),
            (self.td_entry, 'td'),
            (self.matområde_min_entry, 'matområde_min'),
            (self.matområde_max_entry, 'matområde_max'),
            (self.proc_k_entry, 'proc_k'),
            (self.proc_t_entry, 'proc_t'),
            (self.proc_dead_entry, 'proc_dead_time'),
            (self.onoff_high_entry, 'onoff_hysteresis_high'),
            (self.onoff_low_entry, 'onoff_hysteresis_low'),
            (self.u_min_entry, 'u_min'),
            (self.u_max_entry, 'u_max'),
            (self.min_entry, 'graph_min'),
            (self.max_entry, 'graph_max')
        ]
        
        for widget, param_name in widgets_and_params:
            try:
                current_value = widget.get().strip()
                saved_value = str(self.saved_params.get(param_name, '')).strip()
                
                # Normalisera värden för jämförelse (hantera float vs string)
                try:
                    # Försök konvertera båda till float för numerisk jämförelse
                    if current_value == '':
                        current_float = 0.0
                    else:
                        # Skapa tillfällig StringVar för att använda parse_float
                        temp_var = tk.StringVar(value=current_value)
                        current_float = self.parse_float(temp_var)
                    saved_float = float(saved_value) if saved_value else 0.0
                    
                    # Jämför som float med en liten tolerans
                    if abs(current_float - saved_float) >= 0.0001:
                        return True
                except ValueError:
                    # Om någon inte kan konverteras till float, jämför som strängar
                    if current_value != saved_value:
                        return True
            except Exception:
                pass
        return False
    
    def clear_unsaved_highlights(self):
        """Återställer normal appearance för alla entry-fält"""
        entry_widgets = [
            self.sp_entry, self.nv_entry, self.kp_entry, self.ti_entry, self.td_entry,
            self.matområde_min_entry, self.matområde_max_entry,
            self.proc_k_entry, self.proc_t_entry, self.proc_dead_entry,
            self.onoff_high_entry, self.onoff_low_entry,
            self.u_min_entry, self.u_max_entry,
            self.min_entry, self.max_entry
        ]
        
        # Återställ allt till normal
        for widget in entry_widgets:
            try:
                # Återställ ttk style
                widget.configure(style='TEntry')
            except Exception:
                pass
                
            try:
                # Återställ direkta färger
                widget.configure(background='white', foreground='black', insertbackground='black')
            except Exception:
                pass
                
            try:
                # Återställ parent frame
                parent = widget.master
                parent.configure(bg='SystemButtonFace', relief='flat', bd=1)
            except Exception:
                pass
                
            try:
                # Ta bort textmarkering
                widget.selection_clear()
            except Exception:
                pass
        
        self.unsaved_changes = False
        
    def has_unsaved_graph_changes(self):
        """Kontrollerar om graf-skala har osparade ändringar"""
        try:
            current_min = self.parse_float(self.process_min)
            current_max = self.parse_float(self.process_max)
            saved_min = self.saved_params.get('graph_min', current_min)
            saved_max = self.saved_params.get('graph_max', current_max)
            
            return (abs(current_min - saved_min) >= 0.0001 or 
                   abs(current_max - saved_max) >= 0.0001)
        except Exception:
            return False
            
    def highlight_unsaved_graph_changes(self):
        """Markerar graf-skala fält som ändrats med röd text"""
        graph_widgets_and_params = [
            (self.min_entry, 'graph_min'),
            (self.max_entry, 'graph_max')
        ]
        
        for widget, param_name in graph_widgets_and_params:
            try:
                current_value = widget.get().strip()
                saved_value = str(self.saved_params.get(param_name, '')).strip()
                
                try:
                    if current_value:
                        temp_var = tk.StringVar(value=current_value)
                        current_float = self.parse_float(temp_var)
                    else:
                        current_float = 0.0
                    saved_float = float(saved_value) if saved_value else 0.0
                    values_equal = abs(current_float - saved_float) < 0.0001
                except ValueError:
                    values_equal = current_value == saved_value
                
                if not values_equal:
                    widget.configure(foreground='red')
                else:
                    widget.configure(foreground='black')
            except Exception:
                pass
                
    def clear_unsaved_graph_highlights(self):
        """Återställer normal appearance för graf-skala fält"""
        graph_widgets = [self.min_entry, self.max_entry]
        
        for widget in graph_widgets:
            try:
                widget.configure(style='TEntry')
                widget.configure(background='white', foreground='black', insertbackground='black')
                widget.selection_clear()
            except Exception:
                pass
                
    def save_graph_changes(self):
        """Sparar ändringar i graf-skala"""
        self.saved_params['graph_min'] = self.parse_float(self.process_min)
        self.saved_params['graph_max'] = self.parse_float(self.process_max)
        
        # Normalisera fälten till decimal punkt efter sparning
        self.process_min.set(f"{self.saved_params['graph_min']:.6g}")
        self.process_max.set(f"{self.saved_params['graph_max']:.6g}")
        
        # Nu när alla saved_params är uppdaterade, kör highlight för att återställa färgerna korrekt
        self.highlight_unsaved_changes()
        
        # Uppdatera plotten med nya skalningsvärden
        self.update_plot()
        
    def save_regulator_changes(self, save_to_history=True):
        """Sparar ändringar i Regulatorparametrar (Kp, Ti, Td, börvärde, mätområde, utsignal)"""
        # Spara nuvarande simulering till historik INNAN vi uppdaterar parametrarna
        if save_to_history and len(self.t) > 10:
            self.save_simulation_to_history()
            
        # Uppdatera sparade parametrar från GUI-värdena - endast regulatorparametrar
        self.saved_params['kp'] = self.parse_float(self.kp_var)
        self.saved_params['ti'] = self.parse_float(self.ti_var)
        self.saved_params['td'] = self.parse_float(self.td_var)
        self.saved_params['i_active'] = self.i_active_var.get()
        self.saved_params['d_active'] = self.d_active_var.get()
        self.saved_params['preset'] = self.preset_mode.get()  # Spara aktuell preset-typ
        
        # Uppdatera börvärde
        try:
            self.saved_params['setpoint'] = self.parse_float(self.sp_var)
            self.setpoint = self.saved_params['setpoint']
        except ValueError:
            self.saved_params['setpoint'] = 0.0
            self.setpoint = 0.0
        
        # Uppdatera mätområde
        old_matområde_min = self.saved_params.get('matområde_min', self.parse_float(self.matområde_min_var))
        old_matområde_max = self.saved_params.get('matområde_max', self.parse_float(self.matområde_max_var))
        self.saved_params['matområde_min'] = self.parse_float(self.matområde_min_var)
        self.saved_params['matområde_max'] = self.parse_float(self.matområde_max_var)
        
        # Kontrollera om mätområdet har ändrats och uppdatera graf-skalan automatiskt
        if (old_matområde_min != self.saved_params['matområde_min'] or 
            old_matområde_max != self.saved_params['matområde_max']):
            # Återställ graf-skalan till det nya mätområdet
            self.process_min.set(self.saved_params['matområde_min'])
            self.process_max.set(self.saved_params['matområde_max'])
            # Uppdatera processmodellen
            self.process.matområde_min = self.saved_params['matområde_min']
            self.process.matområde_max = self.saved_params['matområde_max']
        
        # Uppdatera utsignal gränser
        self.saved_params['u_min'] = self.parse_float(self.u_min_var)
        self.saved_params['u_max'] = self.parse_float(self.u_max_var)
        self.u_min = self.saved_params['u_min'] 
        self.u_max = self.saved_params['u_max']
        
        # Uppdatera OnOff hysteresis-parametrar
        self.saved_params['onoff_hysteresis_high'] = self.parse_float(self.onoff_hysteresis_high)
        self.saved_params['onoff_hysteresis_low'] = self.parse_float(self.onoff_hysteresis_low)
        self.saved_params['onoff_hysteresis_type'] = self.onoff_hysteresis_type.get()
        
        # Applicera sparade parametrar till PID-regulatorn
        self.pid.Kp = self.saved_params['kp']
        self.pid.Ti = self.saved_params['ti'] if self.saved_params['i_active'] else 1e6
        self.pid.Td = self.saved_params['td'] if self.saved_params['d_active'] else 0.0
        
        # Uppdatera On/Off hysteresis (både typ och värden)
        self.onoff_controller.hysteresis_type = self.onoff_hysteresis_type.get()
        self.onoff_controller.hysteresis_high = self.saved_params['onoff_hysteresis_high']
        self.onoff_controller.hysteresis_low = self.saved_params['onoff_hysteresis_low']
        
        # Uppdatera manuellt läge
        if self.manual_mode_var.get():
            self.manual_output = self.parse_float(self.manual_output_var)
        
        # Normalisera fälten till decimal punkt efter sparning
        self.kp_var.set(f"{self.saved_params['kp']:.6g}")
        self.ti_var.set(f"{self.saved_params['ti']:.6g}")
        self.td_var.set(f"{self.saved_params['td']:.6g}")
        self.sp_var.set(f"{self.saved_params['setpoint']:.6g}")
        self.matområde_min_var.set(f"{self.saved_params['matområde_min']:.6g}")
        self.matområde_max_var.set(f"{self.saved_params['matområde_max']:.6g}")
        self.u_min_var.set(f"{self.saved_params['u_min']:.6g}")
        self.u_max_var.set(f"{self.saved_params['u_max']:.6g}")
        self.onoff_hysteresis_high.set(f"{self.saved_params['onoff_hysteresis_high']:.6g}")
        self.onoff_hysteresis_low.set(f"{self.saved_params['onoff_hysteresis_low']:.6g}")
        
        # Nu när alla saved_params är uppdaterade, kör highlight för att återställa färgerna korrekt
        self.highlight_unsaved_changes()
        
        # Uppdatera legend-display för att visa de nya parametrarna
        self.update_legend_display()
        
        # Uppdatera plot (utan att resetta historiken)
        self.update_plot()
    
    def save_system_changes(self):
        """Sparar ändringar i Systemparametrar (normalvärde, processparametrar)"""
        # Uppdatera normalvärde
        self.saved_params['nv'] = self.parse_float(self.nv_var)
        
        # Uppdatera processparametrar
        self.saved_params['proc_k'] = self.parse_float(self.proc_k_var)
        self.saved_params['proc_t'] = self.parse_float(self.proc_t_var)
        self.saved_params['proc_dead_time'] = self.parse_float(self.proc_dead_var)
        
        # Uppdatera processmodellen
        self.process.K = self.saved_params['proc_k']
        self.process.T = self.saved_params['proc_t'] 
        self.process.dead_time = self.saved_params['proc_dead_time']
        self.process.normalvarde = self.saved_params['nv']
        
        # Normalisera fälten till decimal punkt efter sparning
        self.nv_var.set(f"{self.saved_params['nv']:.6g}")
        self.proc_k_var.set(f"{self.saved_params['proc_k']:.6g}")
        self.proc_t_var.set(f"{self.saved_params['proc_t']:.6g}")
        self.proc_dead_var.set(f"{self.saved_params['proc_dead_time']:.6g}")
        
        # Nu när alla saved_params är uppdaterade, kör highlight för att återställa färgerna korrekt
        self.highlight_unsaved_changes()
        
        # Rensa simulation historik eftersom processparametrar har ändrats
        self.clear_simulation_history()
        
        # Uppdatera plot (utan att resetta historiken)
        self.update_plot()
        
    def reset_scale(self):
        """Återställer skalning till mätområdet"""
        # Sätt skalning till samma som mätområdet
        self.process_min.set(self.parse_float(self.matområde_min_var))
        self.process_max.set(self.parse_float(self.matområde_max_var))
        
        # Uppdatera även saved_params så att graf-skala blir "sparad"
        self.saved_params['graph_min'] = self.parse_float(self.matområde_min_var)
        self.saved_params['graph_max'] = self.parse_float(self.matområde_max_var)
        
        # Återställ highlights eftersom värdena nu är "sparade"
        self.clear_unsaved_graph_highlights()
        
        self.update_plot()
        self.update_percent_status()
        
    def update_percent_status(self):
        """Uppdaterar statustext för procentvisning"""
        if self.percent_mode_var.get() and len(self.y) > 0:
            current_y = self.y[-1]
            current_sp = self.sp[-1] if len(self.sp) > 0 else self.setpoint
            nv = self.parse_float(self.nv_var)
            
            y_pct = self.to_percent(current_y)
            sp_pct = self.to_percent(current_sp)
            nv_pct = self.to_percent(nv)
            
            status = f"Aktuellt: PV={y_pct:.1f}%, BV={sp_pct:.1f}%, NV={nv_pct:.1f}%"
            self.percent_status_label.config(text=status)
        else:
            self.percent_status_label.config(text="")
            
    def export_plots(self):
        """Exportera grafer till fil"""
        from tkinter import filedialog, messagebox
        
        # Föreslå filnamn baserat på parametrar
        kp = self.parse_float(self.kp_var)
        ti = self.parse_float(self.ti_var)
        td = self.parse_float(self.td_var)
        filename = f"PID_Kp{kp:.1f}_Ti{ti:.1f}_Td{td:.1f}"
        
        # Filtypsalternativ
        filetypes = [
            ("PNG-bild", "*.png"),
            ("PDF-dokument", "*.pdf"),
            ("SVG-vektor", "*.svg"),
            ("Alla filer", "*.*")
        ]
        
        filepath = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=filetypes,
            initialfile=filename
        )
        
        if filepath:
            try:
                # Spara graferna med hög upplösning
                self.fig.savefig(filepath, dpi=300, bbox_inches='tight')
                messagebox.showinfo("Export", f"Grafer sparade som:\n{filepath}", parent=self.root)
            except Exception as e:
                messagebox.showerror("Fel", f"Kunde inte spara grafer:\n{str(e)}", parent=self.root)
    
    def export_data(self):
        """Exportera rådata till CSV-fil"""
        from tkinter import filedialog, messagebox
        import csv
        
        if len(self.t) < 2:
            messagebox.showwarning("Varning", "Ingen data att exportera. Kör simuleringen först.", parent=self.root)
            return
            
        # Föreslå filnamn
        kp = self.parse_float(self.kp_var)
        ti = self.parse_float(self.ti_var) 
        td = self.parse_float(self.td_var)
        filename = f"PID_data_Kp{kp:.1f}_Ti{ti:.1f}_Td{td:.1f}.csv"
        
        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV-filer", "*.csv"), ("Alla filer", "*.*")],
            initialfile=filename
        )
        
        if filepath:
            try:
                with open(filepath, 'w', newline='', encoding='utf-8-sig') as csvfile:
                    writer = csv.writer(csvfile, delimiter=';')  # Svenskt CSV-format
                    
                    # Rubrikrad
                    headers = ['Tid', 'Processvärde', 'Börvärde', 'Regulatorut', 'Fel', 'P-bidrag', 'I-bidrag', 'D-bidrag']
                    if self.percent_mode_var.get():
                        headers[1] += ' (%)'
                        headers[2] += ' (%)'
                    writer.writerow(headers)
                    
                    # Data
                    kp = self.parse_float(self.kp_var)
                    ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0.0
                    td = self.parse_float(self.td_var) if self.d_active_var.get() else 0.0
                    
                    for i in range(len(self.t)):
                        y_val = self.y[i] if i < len(self.y) else None
                        sp_val = self.sp[i] if i < len(self.sp) else None
                        u_val = self.u[i] if i < len(self.u) else None
                        e_val = self.e[i] if i < len(self.e) else None
                        
                        # Konvertera till procent om valt
                        if self.percent_mode_var.get() and y_val is not None:
                            y_val = self.to_percent(y_val)
                        if self.percent_mode_var.get() and sp_val is not None:
                            sp_val = self.to_percent(sp_val)
                            
                        # Beräkna PID-bidrag
                        p_val = kp * e_val if e_val is not None else None
                        i_val = (kp/ti * self.i[i]) if (i < len(self.i) and self.i[i] is not None and ti != 0) else None
                        d_val = (-kp*td * self.d[i]) if (i < len(self.d) and self.d[i] is not None) else None
                        
                        row = [
                            f"{self.t[i]:.1f}".replace('.', ','),  # Svenska decimalkomma
                            f"{y_val:.2f}".replace('.', ',') if y_val is not None else '',
                            f"{sp_val:.2f}".replace('.', ',') if sp_val is not None else '',
                            f"{u_val:.2f}".replace('.', ',') if u_val is not None else '',
                            f"{e_val:.2f}".replace('.', ',') if e_val is not None else '',
                            f"{p_val:.2f}".replace('.', ',') if p_val is not None else '',
                            f"{i_val:.2f}".replace('.', ',') if i_val is not None else '',
                            f"{d_val:.2f}".replace('.', ',') if d_val is not None else ''
                        ]
                        writer.writerow(row)
                        
                messagebox.showinfo("Export", f"Data sparad som:\n{filepath}", parent=self.root)
            except Exception as e:
                messagebox.showerror("Fel", f"Kunde inte spara data:\n{str(e)}", parent=self.root)
                
    def to_percent(self, value):
        """Konvertera värde till procent baserat på mätområdet"""
        min_val = self.parse_float(self.matområde_min_var)
        max_val = self.parse_float(self.matområde_max_var)
        if max_val == min_val:
            return 0.0
        return 100.0 * (value - min_val) / (max_val - min_val)
        
    def from_percent(self, percent):
        """Konvertera från procent till verkligt värde baserat på mätområdet"""
        min_val = self.parse_float(self.matområde_min_var)
        max_val = self.parse_float(self.matområde_max_var)
        return min_val + (max_val - min_val) * percent / 100.0

    def start(self):
        self.running = True
        self._auto_paused = False  # Släpp alltid auto-paus när Kör trycks
        self.update_buttons()
        # Nollställ auto-paus innan första steget
        self._auto_paused = False
        self.simulate(step=True)
        # Om running fortfarande är True (dvs inte auto-pausad), fortsätt loopen
        if self.running:
            self.root.after(300, self.simulate)

    def pause(self):
        self.running = False
        self.update_buttons()

    def step_once(self):
        self.running = False
        self.update_buttons()
        T_min = 0.01
        T_value = self.parse_float(self.proc_t_var)
        if T_value < T_min:
            self.proc_t_var.set(str(T_min))
            import tkinter.messagebox as msgbox
            msgbox.showerror(
                "Felaktig tidskonstant",
                f"Tidskonstanten T måste vara minst {T_min}.\n"
                f"Simuleringen har stoppats och T har satts till {T_min}."
            )
            return
        self.simulate(step=True)

    def update_buttons(self):
        # Uppdatera knapptext dynamiskt baserat på simuleringstillstånd
        self.update_start_button_text()
        
        # Kör-knappen inaktiv under körning, aktiv annars
        # Om auto-pausad: Kör aktiv, Paus inaktiv
        if self.running:
            self.start_btn.state(["disabled"])
            self.pause_btn.state(["!disabled"])
            self.step_btn.state(["disabled"])
            self.reset_btn.state(["disabled"])
            self.save_btn.state(["disabled"])  # Spara inaktiv under körning
        elif self._auto_paused:
            self.start_btn.state(["!disabled"])
            self.pause_btn.state(["disabled"])
            self.step_btn.state(["!disabled"])
            self.reset_btn.state(["!disabled"])
            self.save_btn.state(["!disabled"])  # Spara aktiv när pausad
        else:
            self.start_btn.state(["!disabled"])
            self.pause_btn.state(["disabled"])
            self.step_btn.state(["!disabled"])
            self.reset_btn.state(["!disabled"])
            # Spara aktiv endast om det finns simuleringsdata
            if self.t and len(self.t) > 0:
                self.save_btn.state(["!disabled"])
            else:
                self.save_btn.state(["disabled"])

    def update_start_button_text(self):
        """Uppdaterar start-knappens text baserat på simuleringstillstånd"""
        if self.current_step == 0:
            # Simuleringen är nollställd/återställd
            button_text = "Starta"
        else:
            # Simuleringen har data och är pausad
            button_text = "Fortsätt"
        
        self.start_btn.config(text=button_text)

    def save_simulation_to_history(self, override_params=None):
        """Sparar nuvarande simulering till historik för jämförelse"""
        if len(self.t) < 10:  # Bara spara om vi har tillräckligt med data
            return
            
        # Skapa kopia av nuvarande data
        # Använd override_params om de finns, annars hämta från aktuella inställningar
        if override_params:
            params = override_params
        else:
            params = {
                'Kp': self.saved_params['kp'],
                'Ti': self.saved_params['ti'],
                'Td': self.saved_params['td'],
                'preset': self.preset_mode.get(),
                'onoff_hysteresis_high': self.saved_params.get('onoff_hysteresis_high', 0),
                'onoff_hysteresis_low': self.saved_params.get('onoff_hysteresis_low', 0),
                'onoff_hysteresis_type': self.saved_params.get('onoff_hysteresis_type', 'both'),
                'u_min': self.saved_params.get('u_min', 0),
                'u_max': self.saved_params.get('u_max', 100),
                'color_id': self.next_color_id,  # Permanent färg-ID
                'timestamp': len(self.simulation_history)
            }
            
        simulation_data = {
            'data': {
                't': self.t.copy(),
                'y': self.y.copy(),
                'u': self.u.copy(),
                'sp': self.sp.copy(),
                'e': self.e.copy(),
                'i': self.i.copy(),
                'd': self.d.copy()
            },
            'params': params
        }
        
        # Lägg till i historik
        self.simulation_history.append(simulation_data)
        
        # Öka färg-ID för nästa simulering
        self.next_color_id += 1
        
        # Begränsa antal sparade simuleringar
        while len(self.simulation_history) > self.max_history_size:
            self.simulation_history.pop(0)
            
        # Rensa nuvarande data för att starta en ny simulering
        self.reset_current_simulation_data()
        
        # Uppdatera legend-display efter historikändring
        self.update_legend_display()
    
    def reset_current_simulation_data(self):
        """Rensar nuvarande simuleringsdata för att börja en ny jämförelse"""
        self.t = []
        self.y = []
        self.sp = []
        self.u = []
        self.e = []
        self.i = []
        self.d = []
        self.current_step = 0
        
        # Återställ PID-regulator (skapa ny instans för att rensa integrerat fel och derivata minne)
        self.pid = PID(Kp=self.parse_float(self.kp_var), Ti=self.parse_float(self.ti_var), Td=self.parse_float(self.td_var), dt=self.dt)
        
        # Återställ process till initialvärde (skapa ny instans)
        self.process = Process(
            K=self.parse_float(self.proc_k_var),
            T=self.validate_T_value(show_warning=False),
            dead_time=self.parse_float(self.proc_dead_var),
            integrerande=self.integrerande_var.get(),
            Fout=self.parse_float(self.proc_fout_var),
            normalvarde=self.parse_float(self.nv_var),
            matområde_min=self.parse_float(self.matområde_min_var),
            matområde_max=self.parse_float(self.matområde_max_var),
            enhetslös_K=self.enhetslös_K_var.get()
        )
        
        # Stoppa simuleringen om den körs
        self.running = False
        self.update_buttons()
    
    def clear_simulation_history(self):
        """Rensar simulation historik (anropas vid processparameterändringar)"""
        self.simulation_history.clear()
        
        # Uppdatera legend-display efter historikändring
        self.update_legend_display()
    
    def remove_simulation_from_history(self, index):
        """Tar bort en specifik simulering från historiken"""
        if 0 <= index < len(self.simulation_history):
            self.simulation_history.pop(index)
            # Uppdatera legend-display efter ändring
            self.update_legend_display()
            # Uppdatera plot för att reflektera ändringen
            self.update_plot()
    
    def save_to_history_dialog(self):
        """Dialog för att spara nuvarande simulering till historik med namn"""
        if not self.t or len(self.t) == 0:
            messagebox.showwarning("Ingen simulering", "Det finns ingen simuleringsdata att spara.\nKör en simulering först.", parent=self.root)
            return
            
        # Föreslå automatiskt namn baserat på nuvarande parametrar
        preset = self.preset_mode.get()
        if preset == "P":
            suggested_name = f"P(Kp={self.saved_params['kp']})"
        elif preset == "PI":
            suggested_name = f"PI(Kp={self.saved_params['kp']}, Ti={self.saved_params['ti']})"
        elif preset == "PID":
            suggested_name = f"PID(Kp={self.saved_params['kp']}, Ti={self.saved_params['ti']}, Td={self.saved_params['td']})"
        else:
            suggested_name = f"{preset}"
            
        # Skapa egen centrerad dialog
        name = self.get_centered_input("Spara till historik", "Ange namn för denna simulering:", suggested_name)
        
        if name:  # Om användaren inte tryckte Cancel
            self.save_current_simulation_with_name(custom_name=name)
    
    def get_centered_input(self, title, prompt, initial_value=""):
        """Skapa en centrerad input-dialog"""
        dialog = tk.Toplevel(self.root)
        dialog.title(title)
        dialog.resizable(False, False)
        
        # Sätt dialog som modal
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Skapa innehåll
        main_frame = ttk.Frame(dialog, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Prompt text
        ttk.Label(main_frame, text=prompt).pack(pady=(0, 10))
        
        # Entry fält
        entry_var = tk.StringVar(value=initial_value)
        entry = ttk.Entry(main_frame, textvariable=entry_var, width=40)
        entry.pack(pady=(0, 15))
        entry.focus_set()
        entry.select_range(0, tk.END)
        
        # Knappar
        button_frame = ttk.Frame(main_frame)
        button_frame.pack()
        
        result = {"value": None}
        
        def on_ok():
            result["value"] = entry_var.get()
            dialog.destroy()
            
        def on_cancel():
            result["value"] = None
            dialog.destroy()
        
        ttk.Button(button_frame, text="OK", command=on_ok).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Avbryt", command=on_cancel).pack(side=tk.LEFT)
        
        # Bind Enter och Escape
        dialog.bind('<Return>', lambda e: on_ok())
        dialog.bind('<Escape>', lambda e: on_cancel())
        
        # Centrera dialogen
        dialog.update_idletasks()
        width = dialog.winfo_reqwidth()
        height = dialog.winfo_reqheight()
        
        # Få huvudfönstrets position och storlek
        root_x = self.root.winfo_x()
        root_y = self.root.winfo_y()
        root_width = self.root.winfo_width()
        root_height = self.root.winfo_height()
        
        # Beräkna centrum
        x = root_x + (root_width // 2) - (width // 2)
        y = root_y + (root_height // 2) - (height // 2)
        
        dialog.geometry(f"{width}x{height}+{x}+{y}")
        
        # Vänta på att dialogen stängs
        dialog.wait_window()
        
        return result["value"]
    
    def clear_history_dialog(self):
        """Dialog för att bekräfta rensning av historik"""
        if not self.simulation_history:
            messagebox.showinfo("Tom historik", "Historiken är redan tom.", parent=self.root)
            return
            
        result = messagebox.askyesno(
            "Rensa historik", 
            f"Är du säker på att du vill rensa alla {len(self.simulation_history)} sparade simuleringar?",
            parent=self.root
        )
        
        if result:
            self.clear_simulation_history()
            messagebox.showinfo("Historik rensad", "Alla sparade simuleringar har tagits bort.", parent=self.root)
    
    def save_current_simulation_with_name(self, custom_name=None):
        """Sparar nuvarande simulering till historik med möjlighet att ange eget namn"""
        if not self.t or len(self.t) == 0:
            return  # Ingen data att spara
            
        # Skapa override_params med custom_name om det finns
        override_params = {
            'Kp': self.saved_params['kp'],
            'Ti': self.saved_params['ti'],
            'Td': self.saved_params['td'],
            'preset': self.preset_mode.get(),
            'onoff_hysteresis_high': self.saved_params.get('onoff_hysteresis_high', 0),
            'onoff_hysteresis_low': self.saved_params.get('onoff_hysteresis_low', 0),
            'onoff_hysteresis_type': self.saved_params.get('onoff_hysteresis_type', 'both'),
            'u_min': self.saved_params.get('u_min', 0),
            'u_max': self.saved_params.get('u_max', 100),
            'color_id': self.next_color_id,
            'timestamp': len(self.simulation_history),
            'custom_name': custom_name  # Lägg till custom namn
        }
        
        # Använd befintlig metod men med vårt override
        self.save_simulation_to_history(override_params)

    def _plot_simulation_history(self):
        """Plottar historiska simuleringar med progressiv transparens"""
        if not self.simulation_history:
            return
            
        # Alpha-värden för progressiv transparens
        alpha_values = [0.3, 0.4, 0.5, 0.6, 0.7]  # Äldst till nyast
        # Matplotlib standard färger som matchar legend
        plot_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]  # C0-C4
        
        for i, simulation in enumerate(self.simulation_history):
            alpha = alpha_values[min(i, len(alpha_values)-1)]
            # Använd det permanenta färg-ID istället för nuvarande position
            color_id = simulation['params'].get('color_id')
            if color_id is None:
                # Fallback för äldre simuleringar utan color_id - tilldela baserat på ordning
                color_id = i
                simulation['params']['color_id'] = color_id
            color = plot_colors[color_id % len(plot_colors)]
            data = simulation['data']
            params = simulation['params']
            
            # Konvertera till samma format som nuvarande plotting
            t_hist = data['t']
            y_hist = data['y']
            u_hist = data['u']
            sp_hist = data['sp']
            
            # Konvertera till procent om valt
            if self.percent_mode_var.get():
                y_plot_hist = [self.to_percent(val) for val in y_hist]
                sp_plot_hist = [self.to_percent(val) for val in sp_hist]
            else:
                y_plot_hist = y_hist
                sp_plot_hist = sp_hist
            
            # Skapa label med parametrar
            preset = params.get('preset', 'PID')
            if preset == 'OnOff':
                label_suffix = f"OnOff"
            else:
                kp = params.get('Kp', 0)
                ti = params.get('Ti', 0)
                td = params.get('Td', 0)
                if preset == 'P':
                    label_suffix = f"P: Kp={kp:.1f}"
                elif preset == 'PI':
                    label_suffix = f"PI: Kp={kp:.1f}, Ti={ti:.1f}"
                else:  # PID
                    label_suffix = f"PID: Kp={kp:.1f}, Ti={ti:.1f}, Td={td:.1f}"
            
            # Plotta processvärde och börvärde (första grafen) - utan label för legend
            self.axs[0].plot(t_hist, sp_plot_hist, 'k--', alpha=alpha, linewidth=1)
            self.axs[0].plot(t_hist, y_plot_hist, color=color, alpha=alpha, linewidth=1)

    def simulate(self, step=False):
        # Kontrollera numerisk instabilitet: PV utanför ±2×mätområdets gränser
        mat_min = self.parse_float(self.matområde_min_var)
        mat_max = self.parse_float(self.matområde_max_var)
        pv = self.process.y
        if pv < mat_min - abs(mat_max-mat_min)*2 or pv > mat_max + abs(mat_max-mat_min)*2:
            self.running = False
            self._auto_paused = False
            self.update_buttons()
            import tkinter.messagebox as msgbox
            msgbox.showerror(
                "Numerisk instabilitet",
                f"Processvärdet (PV) har gått utanför rimliga gränser.\n\n"
                f"PV = {pv:.3g}, mätområde = [{mat_min}, {mat_max}]\n\n"
                "Möjliga orsaker:\n"
                "- För liten tidskonstant T\n"
                "- För stort tidssteg dt\n"
                "- Extremt höga regulatorparametrar (Kp, Ti, Td)\n\n"
                "Åtgärder:\n"
                "- Öka T\n"
                "- Minska dt (hastighet)\n"
                "- Justera Kp, Ti, Td till rimliga värden"
            )
            return
        if self.current_step >= self.n_steps:
            self.running = False
            self._auto_paused = False
            self.update_buttons()
            return
        # Automatisk paus om ärvärdet varit inom ±5% av börvärdet under 20 steg
        window = 20
        # Blockera autopaus om användaren valt det
        if self.autopause_var.get():
            if len(self.y) > window and not self._auto_paused:
                y_arr = np.array(self.y[-window:])
                sp_arr = np.array(self.sp[-window:])
                # Auto-paus om ärvärdet är nära BV (±5%)
                within_5 = np.abs(y_arr - sp_arr) <= 0.05 * np.abs(sp_arr)
                # Auto-paus om ärvärdet är stabilt (liten variation)
                bv_ref = np.abs(sp_arr[0]) if np.abs(sp_arr[0]) > 0 else 1.0
                stable = (np.max(y_arr) - np.min(y_arr)) < max(0.01 * bv_ref, 0.5)
                if np.all(within_5) or stable:
                    if not step:
                        self.running = False
                        self._auto_paused = True
                        self.update_buttons()
                        return
        # Hämta parametrar från sparade värden (inte GUI) 
        self.pid.Kp = self.saved_params['kp']
        Ti = self.saved_params['ti'] if self.saved_params['i_active'] else 0.0
        Td = self.saved_params['td'] if self.saved_params['d_active'] else 0.0
        self.pid.Ti = Ti if Ti != 0 else 1e12  # undvik div 0, men ingen I-del om inaktiv
        self.pid.Td = Td
        # Använd sparat börvärde och konvertera vid behov
        current_setpoint = self.saved_params['setpoint']
        
        # Konvertera setpoint till fysiska enheter om GUI visar procent
        # (Processen arbetar alltid internt med fysiska enheter)
        if self.percent_mode_var.get():
            # Börvärdet är sparat som %, konvertera till fysisk enhet för beräkning
            try:
                mat_min = self.saved_params['matområde_min']
                mat_max = self.saved_params['matområde_max']
                current_setpoint = mat_min + (current_setpoint / 100.0) * (mat_max - mat_min)
            except (ValueError, ZeroDivisionError):
                pass  # Behåll originalvärdet om konvertering misslyckas
        self.process.K = self.saved_params['proc_k']
        self.process.T = self.saved_params['proc_t']
        self.process.dead_time = self.saved_params['proc_dead_time']
        self.process.integrerande = self.integrerande_var.get()
        self.process.Fout = self.parse_float(self.proc_fout_var)
        self.process.normalvarde = self.saved_params['nv']
        # Uppdatera mätområde från sparade värden
        self.process.matområde_min = self.saved_params['matområde_min']
        self.process.matområde_max = self.saved_params['matområde_max']
        self.process.enhetslös_K = self.enhetslös_K_var.get()
        # --- Störningar ---
        noise_std = self.parse_float(self.noise_std_var)
        noise = np.random.normal(0, noise_std) if noise_std > 0 else 0.0
        pulse = 0.0
        if getattr(self, 'pulse_active', False) and getattr(self, 'pulse_steps_left', 0) > 0:
            pulse = self.pulse_mag_var.get()
            self.pulse_steps_left -= 1
            if self.pulse_steps_left <= 0:
                self.pulse_active = False
        # Simulera ett steg
        pv = self.process.y
        
        # Kontrollera om manuellt läge är aktivt
        if self.manual_mode_var.get():
            # Manuellt läge - använd användarens utsignal
            ctrl = self.parse_float(self.manual_output_var)
            # Begränsa till 0-100%
            ctrl = max(0.0, min(100.0, ctrl))
            # Sätt PID-värden till 0 i manuellt läge
            err = current_setpoint - pv
            integ = 0.0
            deriv = 0.0
        elif self.preset_mode.get() == "OnOff":
            # On/Off-reglering
            ctrl = self.onoff_controller.step(current_setpoint, pv, umin=self.saved_params['u_min'], umax=self.saved_params['u_max'])
            err = current_setpoint - pv
            integ = 0.0
            deriv = 0.0
        else:
            # Automatiskt läge - PID-beräkning med skydd mot division med noll
            try:
                ctrl, err, integ, deriv = self.pid.step(
                    current_setpoint, pv,
                    umin=self.saved_params['u_min'], umax=self.saved_params['u_max'],
                    antiwindup=self.antiwindup_var.get()
                )
            except ZeroDivisionError:
                ctrl, err, integ, deriv = 0.0, 0.0, 0.0, 0.0
        # Applicera störningar på processvärdet (y)
        self.process.step(ctrl, self.dt)
        self.process.y += noise + pulse
        self.current_step += 1
        self.t.append(self.current_step*self.dt)
        self.y.append(self.process.y)
        self.u.append(ctrl)
        self.e.append(err)
        self.i.append(integ if self.i_active_var.get() else None)
        self.d.append(deriv if self.d_active_var.get() else None)
        self.sp.append(current_setpoint)
        
        # Visa formel och resultat med delmoment
        if self.manual_mode_var.get():
            # Manuellt läge - visa enklare information
            formel = "MANUELLT LÄGE\n"
            res = f"Manuell utsignal = {ctrl:.3f}%\n"
            res += f"Fel (BV-PV) = {err:.3f}\n"
            res += f"Processvärde = {pv:.3f}"
        elif self.preset_mode.get() == "OnOff":
            # On/Off-reglering
            formel = "ON/OFF REGLERING\n"
            hyst_type = self.onoff_hysteresis_type.get()
            hyst_high = self.parse_float(self.onoff_hysteresis_high)
            hyst_low = self.parse_float(self.onoff_hysteresis_low)
            
            if hyst_type == "upper":
                res = f"Hysteresis: Över BV +{hyst_high:.1f}\n"
            elif hyst_type == "lower":
                res = f"Hysteresis: Under BV -{hyst_low:.1f}\n"
            else:
                res = f"Hysteresis: BV ±{hyst_high:.1f}/±{hyst_low:.1f}\n"
                
            res += f"Utsignal = {ctrl:.0f}% ({'PÅ' if ctrl > 50 else 'AV'})\n"
            res += f"Fel (BV-PV) = {err:.3f}\n"
            res += f"Processvärde = {pv:.3f}"
        else:
            # Automatiskt läge - visa PID-beräkning
            formel = "u = P + I + D\n"
            p_str = f"P = Kp*e = {self.pid.Kp:.2f}*{err:.3f} = {self.pid.Kp*err:.3f}"
            if self.i_active_var.get():
                i_str = f"I = Kp/Ti*I = {self.pid.Kp:.2f}/{self.pid.Ti:.2f}*{integ:.3f} = {self.pid.Kp/self.pid.Ti*integ:.3f}"
            else:
                i_str = "I = 0"
            if self.d_active_var.get():
                d_str = f"D = -Kp*Td*d = -{self.pid.Kp:.2f}*{self.pid.Td:.2f}*{deriv:.3f} = {-self.pid.Kp*self.pid.Td*deriv:.3f}"
            else:
                d_str = "D = 0"
            u_sum = self.pid.Kp*err + (self.pid.Kp/self.pid.Ti*integ if self.i_active_var.get() else 0) + (-self.pid.Kp*self.pid.Td*deriv if self.d_active_var.get() else 0)
            res = f"{p_str}\n{i_str}\n{d_str}\nSumma = {u_sum:.3f}\n"
            res += f"u = {ctrl:.3f}"
            if ctrl == self.u_min or ctrl == self.u_max:
                res += " (begränsad)"
            if self.antiwindup_var.get():
                res += ", antiwindup aktiv"
        self.formel_label.config(text=formel + res)
        self.update_plot()
        self.update_percent_status()  # Uppdatera procentstatus
        if self.running and not step:
            self.root.after(self.speed_var.get(), self.simulate)
        self.update_buttons()

    def update_plot(self):
        for ax in self.axs:
            ax.clear()
        # Återställ markör så att den skapas på nytt vid nästa mouse-over
        self.cursor_line = None
        
        # Rita historik först (med progressiv transparens)
        self._plot_simulation_history()
        
        # Välj datafönster för nuvarande simulering
        if self.window_mode.get() == "window":
            size = self.window_size.get()
            start = self.window_start
            end = min(len(self.t), start + size)
            t = self.t[start:end]
            y = self.y[start:end]
            sp = self.sp[start:end]
            u = self.u[start:end]
            e = self.e[start:end]
            i = [v for v in self.i[start:end]]
            d = [v for v in self.d[start:end]]
        else:
            t = self.t
            y = self.y
            sp = self.sp
            u = self.u
            e = self.e
            i = self.i
            d = self.d
        # Konvertera till procent om valt
        if self.percent_mode_var.get():
            y_plot = [self.to_percent(val) for val in y]
            sp_plot = [self.to_percent(val) for val in sp]
            # För procentvisning, använd alltid 0-100% skala
            ymin, ymax = 0, 100
            ylabel = 'Processvärde (%)'
        else:
            y_plot = y
            sp_plot = sp
            # För fysiska enheter, använd sparade graf-skala värden
            ymin, ymax = self.saved_params.get('graph_min', self.parse_float(self.process_min)), self.saved_params.get('graph_max', self.parse_float(self.process_max))
            ylabel = f'Processvärde ({self.process_unit_var.get()})'
            
        # Plotta
        if self.percent_mode_var.get():
            bv_label = 'Börvärde (%)'
        else:
            bv_label = f'Börvärde ({self.process_unit_var.get()})'
        
        # Plotta endast om vi har data
        if len(t) > 0:
            # Använd samma färgsystem som historiken
            plot_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]  # C0-C4
            current_color = plot_colors[self.next_color_id % len(plot_colors)]
            
            self.axs[0].plot(t, sp_plot, 'k--', label=bv_label, linewidth=2)
            self.axs[0].plot(t, y_plot, color=current_color, label='Nuvarande är-värde', linewidth=2)
        
        # Visa hysteresis-gränser för On/Off-reglering
        if self.preset_mode.get() == "OnOff" and len(t) > 0:
            hyst_type = self.onoff_hysteresis_type.get()
            # Använd sparade hysteresis-värden för plottet
            hyst_high = self.saved_params.get('onoff_hysteresis_high', self.parse_float(self.onoff_hysteresis_high))
            hyst_low = self.saved_params.get('onoff_hysteresis_low', self.parse_float(self.onoff_hysteresis_low))
            
            # Konvertera hysteresis-gränser till samma enhet som plottet
            if self.percent_mode_var.get():
                # I procentläge: konvertera börvärde och hysteresis
                setpoint_plot = self.to_percent(self.setpoint)
                process_range = self.parse_float(self.process_max) - self.parse_float(self.process_min)
                hyst_high_plot = hyst_high * process_range / 100.0
                hyst_low_plot = hyst_low * process_range / 100.0
            else:
                # I vanligt läge: använd direkt värden
                setpoint_plot = self.setpoint
                hyst_high_plot = hyst_high
                hyst_low_plot = hyst_low
            
            # Rita hysteresis-linjer
            if hyst_type in ["upper", "both"]:
                upper_line = [setpoint_plot + hyst_high_plot] * len(t)
                self.axs[0].plot(t, upper_line, 'r:', alpha=0.7, linewidth=1, label=f'Hysteresis +{hyst_high:.1f}')
            
            if hyst_type in ["lower", "both"]:
                lower_line = [setpoint_plot - hyst_low_plot] * len(t)
                self.axs[0].plot(t, lower_line, 'r:', alpha=0.7, linewidth=1, label=f'Hysteresis -{hyst_low:.1f}')
        
        # Tunna horisontella linjer för varje yticks (skala)
        yticks = np.linspace(ymin, ymax, num=8)
        for yy in yticks:
            self.axs[0].axhline(yy, color='gray', linewidth=0.3, alpha=0.5, zorder=0)
        self.axs[0].set_ylim(ymin, ymax)
        self.axs[0].set_ylabel(ylabel)
        # Visa legend endast om det finns data att plotta
        if len(t) > 0:
            self.axs[0].legend()

        if self.manual_mode_var.get():
            # Manuellt läge - visa endast styrsignal
            if len(t) > 0:
                self.axs[1].plot(t, u, label='Nuvarande manuell styrsignal', linewidth=2)
            # Använd endast u-värden för skalning
            all_y = np.array(u)
        elif self.preset_mode.get() == "OnOff":
            # On/Off-läge - visa styrsignal med tydlig on/off-karaktär
            if len(t) > 0:
                self.axs[1].step(t, u, where='post', label='Nuvarande On/Off styrsignal', linewidth=2)
            # Använd endast u-värden för skalning
            all_y = np.array(u)
        else:
            # Automatiskt läge - visa PID-ut och summa
            if len(t) > 0:
                self.axs[1].plot(t, u, label='Nuvarande PID-ut (begränsad)', linewidth=2)
            # Summan av P+I+D (utan begränsning)
            kp = self.parse_float(self.kp_var)
            ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0.0
            td = self.parse_float(self.td_var) if self.d_active_var.get() else 0.0
            # P-bidrag
            p_vals = np.array([kp*val if val is not None else np.nan for val in e])
            pid_components = [p_vals]
            # I-bidrag
            if self.i_active_var.get():
                i_vals = np.array([kp/ti*v if (v is not None and ti != 0) else np.nan for v in i])
                pid_components.append(i_vals)
            # D-bidrag
            if self.d_active_var.get():
                d_vals = np.array([-kp*td*v if v is not None else np.nan for v in d])
                pid_components.append(d_vals)
            # Summa
            if len(pid_components) > 0 and len(pid_components[0]) > 0:
                min_len = min([len(comp) for comp in pid_components])
                sum_vals = np.nansum([comp[:min_len] for comp in pid_components], axis=0)
                if len(t) > 0:
                    self.axs[1].plot(t[:min_len], sum_vals, label='Summa (P+I+D)', linestyle='--', color='black', alpha=0.7)
                # Utöka y-axeln så att både u och summagrafen syns
                all_y = np.concatenate([np.array(u)[:min_len], sum_vals])
            else:
                all_y = np.array(u)
        # Utöka y-axeln så att både u och summagrafen syns
        if len(all_y) > 0:
            umin, umax = np.nanmin(all_y), np.nanmax(all_y)
            if umin == umax:
                umin -= 1
                umax += 1
        else:
            # Tom data - använd standardvärden
            umin, umax = 0, 100
        uticks = np.linspace(umin, umax, num=8)
        for uu in uticks:
            self.axs[1].axhline(uu, color='gray', linewidth=0.3, alpha=0.5, zorder=0)
        self.axs[1].set_ylim(umin, umax)
        if self.manual_mode_var.get():
            self.axs[1].set_ylabel('Manuell styrsignal (%)')
            self.axs[1].set_xlabel('Tid')  # Visa x-axel i manuellt läge
        else:
            self.axs[1].set_ylabel('Styrsignal (%)')
        # Visa legend endast om det finns data att plotta
        if len(t) > 0:
            self.axs[1].legend()

        # Nedersta: P, I, D-bidrag var för sig (endast i automatläge)
        if self.manual_mode_var.get() or self.preset_mode.get() == "OnOff":
            # Manuellt läge eller On/Off - dölj tredje grafen
            self.axs[2].set_visible(False)
            # Aktivera x-axel tick labels på andra grafen när tredje är dold
            self.axs[1].tick_params(axis='x', labelbottom=True)
            self.axs[1].set_xlabel('Tid')
        else:
            # Automatiskt läge - visa PID-bidrag
            self.axs[2].set_visible(True)
            # Dölja x-axel tick labels på andra grafen när tredje är synlig
            self.axs[1].tick_params(axis='x', labelbottom=False)
            self.axs[1].set_xlabel('')
            kp = self.parse_float(self.kp_var)
            ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0.0
            td = self.parse_float(self.td_var) if self.d_active_var.get() else 0.0
            # P-bidrag
            p_vals = np.array([kp*val if val is not None else np.nan for val in e])
            pid_components = [p_vals]
            # I-bidrag
            if self.i_active_var.get():
                i_vals = np.array([kp/ti*v if (v is not None and ti != 0) else np.nan for v in i])
                pid_components.append(i_vals)
            # D-bidrag
            if self.d_active_var.get():
                d_vals = np.array([-kp*td*v if v is not None else np.nan for v in d])
                pid_components.append(d_vals)
                
            if len(t) > 0:
                self.axs[2].plot(t, p_vals, label='P-bidrag')
                idx = 0
                if self.i_active_var.get():
                    self.axs[2].plot(t, i_vals, label='I-bidrag')
                    idx += 1
                if self.d_active_var.get():
                    self.axs[2].plot(t, d_vals, label='D-bidrag')
                    idx += 1
            # Skala och etiketter
            all_vals = np.concatenate([comp[~np.isnan(comp)] if np.any(~np.isnan(comp)) else np.array([0.0]) for comp in pid_components])
            if len(all_vals) == 0:
                all_vals = np.array([0.0, 1.0])
            vmin, vmax = np.min(all_vals), np.max(all_vals)
            if vmin == vmax:
                vmin -= 1
                vmax += 1
            vticks = np.linspace(vmin, vmax, num=8)
            for vv in vticks:
                self.axs[2].axhline(vv, color='gray', linewidth=0.3, alpha=0.5, zorder=0)
            self.axs[2].set_ylim(vmin, vmax)
            
            # Förbättrad ylabel med enhetsinformation
            if self.process_unit_var.get() == "Procent (%)":
                self.axs[2].set_ylabel('PID-bidrag (%)')
            else:
                self.axs[2].set_ylabel(f'PID-bidrag ({self.process_unit_var.get()})')
            
            self.axs[2].set_xlabel('Tid')
            # Visa legend endast om det finns data att plotta
            if len(t) > 0:
                self.axs[2].legend()
        
        # --- Prestandamått ---
        # Spara prestandamått i en lista för framtida jämförelser
        if not hasattr(self, 'performance_history'):
            self.performance_history = []
        perf_text = ""
        try:
            y_arr = np.array(self.y)
            sp_arr = np.array(self.sp)
            t_arr = np.array(self.t)
            if len(y_arr) > 10:
                overshoot = np.max(y_arr) - sp_arr[0]
                overshoot_pct = 100 * overshoot / sp_arr[0] if sp_arr[0] != 0 else 0
                try:
                    rise_idx = np.where(y_arr >= 0.9*sp_arr[0])[0][0]
                    rise_time = t_arr[rise_idx]
                except IndexError:
                    rise_time = np.nan
                try:
                    within_5 = np.abs(y_arr - sp_arr[0]) <= 0.05*np.abs(sp_arr[0])
                    for idx in range(len(within_5)):
                        if np.all(within_5[idx:]):
                            settling_time = t_arr[idx]
                            break
                    else:
                        settling_time = np.nan
                except Exception:
                    settling_time = np.nan
                steady_state_error = y_arr[-1] - sp_arr[0]
                perf_text = f"Översläng: {overshoot:.2f} ({overshoot_pct:.1f}%)  "
                perf_text += f"Stigtid (90%): {rise_time:.1f}  "
                perf_text += f"Inställningstid (±5%): {settling_time:.1f}  "
                perf_text += f"Stationärt fel: {steady_state_error:.2f}"
                # Spara till historik (ersätt sista om vi bara uppdaterar plott)
                if getattr(self, '_just_reset', False):
                    self.performance_history.append({
                        'overshoot': overshoot,
                        'overshoot_pct': overshoot_pct,
                        'rise_time': rise_time,
                        'settling_time': settling_time,
                        'steady_state_error': steady_state_error,
                        'params': {
                            'Kp': self.pid.Kp,
                            'Ti': self.pid.Ti,
                            'Td': self.pid.Td,
                            'K': self.process.K,
                            'T': self.process.T,
                            'dead_time': self.process.dead_time,
                            'integrerande': self.process.integrerande
                        }
                    })
                    self._just_reset = False
        except Exception:
            perf_text = ""
        # Visa prestandamått under graferna
        # Visa prestandamått på separata rader
        perf_lines = ["", "", "", ""]
        if perf_text:
            parts = perf_text.split("  ")
            for i, part in enumerate(parts):
                if i < 4:
                    perf_lines[i] = part.strip()
        for i, lbl in enumerate(self.perf_labels):
            lbl.config(text=perf_lines[i])
        # Rita om och justera layout
        # Anpassa figur-layouten beroende på om vi visar 2 eller 3 plottar
        if self.manual_mode_var.get() or self.preset_mode.get() == "OnOff":
            # Manuellt läge eller On/Off - justera layout för endast 2 plottar
            self.fig.subplots_adjust(hspace=0.3)
        else:
            # Automatiskt läge - normal layout för 3 plottar
            self.fig.subplots_adjust(hspace=0.4)
        self.fig.tight_layout()
        self.canvas.draw()
    def reset(self):
        self._just_reset = True
        self.running = False
        self._auto_paused = False
        self.current_step = 0
        self.process = Process(K=self.parse_float(self.proc_k_var), T=self.validate_T_value(show_warning=True), dead_time=self.parse_float(self.proc_dead_var), integrerande=self.integrerande_var.get(), normalvarde=self.parse_float(self.nv_var))
        self.pid = PID(Kp=self.parse_float(self.kp_var), Ti=self.parse_float(self.ti_var), Td=self.parse_float(self.td_var), dt=self.dt)
        try:
            self.setpoint = self.parse_float(self.sp_var)
        except Exception:
            self.setpoint = 0.0
        self.t = [0]
        self.y = [self.parse_float(self.nv_var)]  # Starta på normalvärdet
        self.u = [0]
        self.e = [0]
        self.i = [0]
        self.d = [0]
        self.sp = [self.setpoint]
        self.formel_label.config(text="")
        # Återställ markör och tooltip
        self.cursor_line = None
        if self.tooltip and self.tooltip.winfo_exists():
            self.tooltip.place_forget()
        self.update_plot()
        self.update_percent_status()  # Uppdatera procentstatus efter reset
        self.update_buttons()  # Uppdatera knappar inklusive start-knappens text
 
import sys

def on_closing(root):
    root.destroy()
    sys.exit(0)

if __name__ == "__main__":
    root = tk.Tk()
    root.state('zoomed')  # Maximera fönstret på Windows
    app = PIDSimulatorApp(root)
    root.protocol("WM_DELETE_WINDOW", lambda: on_closing(root))
    root.mainloop()

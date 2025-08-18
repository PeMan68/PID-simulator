import tkinter as tk
from tkinter import ttk
import numpy as np
import matplotlib
matplotlib.use('TkAgg')
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt

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
        u_unclamped = self.Kp * (error + (1/self.Ti)*integral_candidate - self.Td*derivative)
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
        root.title("PID-simulator v1.3")
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
                              normalvarde=self.nv_var.get(),
                              matområde_min=self.matområde_min_var.get(),
                              matområde_max=self.matområde_max_var.get(),
                              enhetslös_K=self.enhetslös_K_var.get())
        self.pid = PID(Kp=2.0, Ti=10.0, Td=1.0, dt=self.dt)
        self.setpoint = 50.0
        # Begränsning och antiwindup
        self.u_min = 0.0
        self.u_max = 100.0
        self.antiwindup_var = tk.BooleanVar(value=True)
        # Historik
        self.t = [0]
        self.y = [self.nv_var.get()]  # Starta på normalvärdet
        self.u = [0]
        self.e = [0]
        self.i = [0]
        self.d = [0]
        self.sp = [self.setpoint]
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
        
        # Enhetsväxling (True = %, False = verkliga värden)
        self.percent_mode_var = tk.BooleanVar(value=False)
        self.process_min = tk.DoubleVar(value=0.0)   # Sätts intelligent baserat på normalvärde
        self.process_max = tk.DoubleVar(value=100.0) # Sätts intelligent baserat på normalvärde
        
        # Sätt intelligenta Min/Max-värden baserat på normalvärde och förväntat börvärde
        nv = self.nv_var.get()
        # Skapa ett rimligt intervall runt normalvärdet och börvärdet
        min_val = min(nv, self.setpoint) - 20
        max_val = max(nv, self.setpoint) + 30
        self.process_min.set(min_val)
        self.process_max.set(max_val)
        
        # GUI
        self.create_widgets()
        # Tooltip och markör
        self.tooltip = None
        self.cursor_line = None  # For vertical marker
        # Uppdatera hastighetsetikett
        self.update_speed_label()
        self.update_plot()

    def create_widgets(self):
        frame = ttk.Frame(self.root)
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        # Systemparametrar
        sys_frame = ttk.LabelFrame(frame, text="Systemparametrar")
        sys_frame.pack(fill=tk.X, padx=5, pady=5)
        ttk.Label(sys_frame, text="K").grid(row=0, column=0)
        self.proc_k_var = tk.StringVar(value=str(self.process.K))
        ttk.Entry(sys_frame, textvariable=self.proc_k_var, width=6).grid(row=0, column=1)
        ttk.Label(sys_frame, text="T").grid(row=0, column=2)
        self.proc_t_var = tk.StringVar(value=str(self.process.T))
        ttk.Entry(sys_frame, textvariable=self.proc_t_var, width=6).grid(row=0, column=3)
        ttk.Label(sys_frame, text="Dötid").grid(row=0, column=4)
        self.proc_dead_var = tk.StringVar(value=str(self.process.dead_time))
        ttk.Entry(sys_frame, textvariable=self.proc_dead_var, width=6).grid(row=0, column=5)
        ttk.Label(sys_frame, text="Utflöde").grid(row=0, column=6)
        self.proc_fout_var = tk.StringVar(value=str(self.process.Fout))
        ttk.Entry(sys_frame, textvariable=self.proc_fout_var, width=6).grid(row=0, column=7)
        self.integrerande_var = tk.BooleanVar(value=self.process.integrerande)
        ttk.Checkbutton(sys_frame, text="Integrerande", variable=self.integrerande_var).grid(row=0, column=8, columnspan=2)
        
        # --- Mätområde och enhetslös K (ny rad) ---
        ttk.Checkbutton(sys_frame, text="Enhetslös K", variable=self.enhetslös_K_var, command=self.on_enhetslös_K_change).grid(row=2, column=0, columnspan=2, padx=2)
        ttk.Label(sys_frame, text="Mätområde Min").grid(row=2, column=2)
        self.matområde_min_entry = ttk.Entry(sys_frame, textvariable=self.matområde_min_var, width=6)
        self.matområde_min_entry.grid(row=2, column=3)
        ttk.Label(sys_frame, text="Max").grid(row=2, column=4)
        self.matområde_max_entry = ttk.Entry(sys_frame, textvariable=self.matområde_max_var, width=6)
        self.matområde_max_entry.grid(row=2, column=5)
        ttk.Label(sys_frame, text="(°C)").grid(row=2, column=6)
        
        # --- Brusreglage ---
        ttk.Label(sys_frame, text="Brus std").grid(row=1, column=0)
        self.noise_std_var = tk.DoubleVar(value=0.0)
        self.noise_scale = ttk.Scale(sys_frame, from_=0.0, to=5.0, variable=self.noise_std_var, orient=tk.HORIZONTAL, length=100)
        self.noise_scale.grid(row=1, column=1, columnspan=2, sticky="we", padx=2)
        self.noise_entry = ttk.Entry(sys_frame, textvariable=self.noise_std_var, width=5)
        self.noise_entry.grid(row=1, column=3)
        # --- Pulsstörning ---
        ttk.Label(sys_frame, text="Puls (storlek)").grid(row=1, column=4)
        self.pulse_mag_var = tk.DoubleVar(value=10.0)
        self.pulse_entry = ttk.Entry(sys_frame, textvariable=self.pulse_mag_var, width=5)
        self.pulse_entry.grid(row=1, column=5)
        ttk.Label(sys_frame, text="(steg)").grid(row=1, column=6)
        self.pulse_dur_var = tk.IntVar(value=3)
        self.pulse_dur_entry = ttk.Entry(sys_frame, textvariable=self.pulse_dur_var, width=3)
        self.pulse_dur_entry.grid(row=1, column=7)
        self.pulse_active = False
        self.pulse_steps_left = 0
        ttk.Button(sys_frame, text="Pulsstörning", command=self.trigger_pulse).grid(row=1, column=8, padx=2)

        # Regulatorparametrar
        pid_frame = ttk.LabelFrame(frame, text="Regulatorparametrar")
        pid_frame.pack(fill=tk.X, padx=5, pady=5)
        ttk.Label(pid_frame, text="Kp").grid(row=0, column=0)
        self.kp_var = tk.StringVar(value=str(self.pid.Kp))
        ttk.Entry(pid_frame, textvariable=self.kp_var, width=6).grid(row=0, column=1)
        ttk.Label(pid_frame, text="Ti").grid(row=0, column=2)
        self.ti_var = tk.StringVar(value=str(self.pid.Ti))
        ttk.Entry(pid_frame, textvariable=self.ti_var, width=6).grid(row=0, column=3)
        ttk.Checkbutton(pid_frame, text="Integral aktiv", variable=self.i_active_var).grid(row=0, column=4, padx=2)
        ttk.Label(pid_frame, text="Td").grid(row=0, column=5)
        self.td_var = tk.StringVar(value=str(self.pid.Td))
        ttk.Entry(pid_frame, textvariable=self.td_var, width=6).grid(row=0, column=6)
        ttk.Checkbutton(pid_frame, text="Derivata aktiv", variable=self.d_active_var).grid(row=0, column=7, padx=2)
        ttk.Checkbutton(pid_frame, text="Anti-windup", variable=self.antiwindup_var).grid(row=1, column=0, columnspan=2, padx=2)
 
        # Manuellt läge
        ttk.Checkbutton(pid_frame, text="Manuellt läge", variable=self.manual_mode_var, command=self.on_manual_mode_change).grid(row=1, column=2, columnspan=2, padx=2)
        ttk.Label(pid_frame, text="Manuell ut (%)").grid(row=1, column=4)
        self.manual_entry = ttk.Entry(pid_frame, textvariable=self.manual_output_var, width=6)
        self.manual_entry.grid(row=1, column=5)
        self.manual_entry.configure(state="disabled")  # Inaktiverad från början
        # Börvärde
        bv_frame = ttk.LabelFrame(frame, text="Börvärde och Normalvärde")
        bv_frame.pack(fill=tk.X, padx=5, pady=5)
        self.sp_var = tk.StringVar(value=str(self.setpoint))
        # Börvärde (vänster)
        ttk.Label(bv_frame, text="Börvärde").pack(side=tk.LEFT, padx=(5,2))
        ttk.Entry(bv_frame, textvariable=self.sp_var, width=8).pack(side=tk.LEFT)
        ttk.Button(bv_frame, text="Sätt BV", command=self.set_setpoint).pack(side=tk.LEFT, padx=5)
        # Normalvärde (höger)
        ttk.Label(bv_frame, text="Normalvärde").pack(side=tk.LEFT, padx=(20,2))
        self.nv_entry = ttk.Entry(bv_frame, textvariable=self.nv_var, width=8)
        self.nv_entry.pack(side=tk.LEFT)
        ttk.Button(bv_frame, text="Sätt NV", command=self.set_nv).pack(side=tk.LEFT, padx=5)

        # Stegsvarsanalys och enhetsväxling
        analysis_frame = ttk.LabelFrame(frame, text="Stegsvarsanalys och visning")
        analysis_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Första raden - Enhetsväxling
        row1_frame = ttk.Frame(analysis_frame)
        row1_frame.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Checkbutton(row1_frame, text="Visa i procent (%)", variable=self.percent_mode_var, command=self.on_percent_mode_change).pack(side=tk.LEFT, padx=5)
        
        # Skalning för procentvisning
        ttk.Label(row1_frame, text="Skalning - Min:").pack(side=tk.LEFT, padx=(20,2))
        self.min_entry = ttk.Entry(row1_frame, textvariable=self.process_min, width=6)
        self.min_entry.pack(side=tk.LEFT)
        ttk.Label(row1_frame, text="Max:").pack(side=tk.LEFT, padx=(5,2))
        self.max_entry = ttk.Entry(row1_frame, textvariable=self.process_max, width=6)
        self.max_entry.pack(side=tk.LEFT)
        
        # Knapp för att återställa skalning
        ttk.Button(row1_frame, text="Auto-skala", command=self.auto_scale).pack(side=tk.LEFT, padx=(5,0))
        
        # Andra raden - Status och export
        row2_frame = ttk.Frame(analysis_frame)
        row2_frame.pack(fill=tk.X, padx=5, pady=2)
        
        # Status-label för att visa aktuella procent-värden
        self.percent_status_label = ttk.Label(row2_frame, text="", font=("Arial", 9))
        self.percent_status_label.pack(side=tk.LEFT, padx=5)
        
        # Export-knappar
        ttk.Button(row2_frame, text="Exportera grafer", command=self.export_plots).pack(side=tk.RIGHT, padx=5)
        ttk.Button(row2_frame, text="Spara data", command=self.export_data).pack(side=tk.RIGHT, padx=5)

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
        # Plott
        self.fig, self.axs = plt.subplots(3, 1, sharex=True, figsize=(7,6))
        self.canvas = FigureCanvasTkAgg(self.fig, master=self.root)
        # Koppla musrörelse till canvas (måste ske efter att self.canvas skapats)
        self.canvas.mpl_connect('motion_notify_event', self.on_mouse_move)
        self.canvas.get_tk_widget().pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

    def trigger_pulse(self):
        # Aktivera puls-störning
        self.pulse_active = True
        self.pulse_steps_left = self.pulse_dur_var.get()

    def on_enhetslös_K_change(self):
        """Hanterar växling till/från enhetslös K"""
        # Uppdatera process-objektet med nya inställningar
        if not self.running:
            self.process.enhetslös_K = self.enhetslös_K_var.get()
            self.process.matområde_min = self.matområde_min_var.get()
            self.process.matområde_max = self.matområde_max_var.get()
            # Uppdatera K-label för att visa enhet
            self.update_k_label()
    
    def update_k_label(self):
        """Uppdaterar K-etiketten baserat på enhetslös K-inställning"""
        # Detta skulle kunna implementeras för att visa K-enhet
        pass

    def speed_faster(self):
        # Minska delay = snabbare simulering
        current = self.speed_var.get()
        if current > 50:  # Minimum 50ms delay
            new_speed = max(50, current - 50)
            self.speed_var.set(new_speed)
            self.update_speed_label()

    def speed_slower(self):
        # Öka delay = långsammare simulering
        current = self.speed_var.get()
        if current < 1000:  # Maximum 1000ms delay
            new_speed = min(1000, current + 50)
            self.speed_var.set(new_speed)
            self.update_speed_label()

    def update_speed_label(self):
        # Beräkna hastighets-multiplikator (300ms = 1x)
        delay = self.speed_var.get()
        speed_factor = 300 / delay
        if speed_factor >= 1:
            self.speed_label.config(text=f"{speed_factor:.1f}x")
        else:
            self.speed_label.config(text=f"1/{1/speed_factor:.1f}x")

    def parse_float(self, var):
        try:
            return float(str(var.get()).replace(",", "."))
        except Exception:
            return 0.0

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
            self.setpoint = float(str(self.sp_var.get()).replace(",", "."))
        except Exception:
            self.setpoint = 0.0

    def set_nv(self):
        # Hantera svenska decimalkomma för normalvärde
        try:
            nv = float(str(self.nv_entry.get()).replace(",", "."))
            self.nv_var.set(nv)
        except Exception:
            nv = 23.0
        # Uppdatera processens normalvärde direkt
        self.process.normalvarde = self.nv_var.get()
        # Uppdatera även startvärdet och historiken om vi inte är mitt i en simulering
        if not self.running:
            self.process.y = self.nv_var.get()
            # Uppdatera hela dötidshistoriken med nya normalvärdet
            self.process.y_hist = [self.nv_var.get()] * len(self.process.y_hist)
            # Uppdatera den första punkten i plot-historiken
            if len(self.y) > 0:
                self.y[0] = self.nv_var.get()
        self.update_plot()

    def on_manual_mode_change(self):
        """Aktivera/inaktivera manuell kontroll"""
        if self.manual_mode_var.get():
            self.manual_entry.configure(state="normal")
        else:
            self.manual_entry.configure(state="disabled")
        # Uppdatera plotten direkt när manuellt läge växlas
        self.update_plot()
    
    def on_percent_mode_change(self):
        """Hanterar växling till/från procentvisning"""
        self.update_plot()
        self.update_percent_status()
        
    def auto_scale(self):
        """Sätter automatisk skalning baserat på aktuella värden"""
        if len(self.y) > 1:
            # Använd faktiska min/max från data
            min_val = min(min(self.y), min(self.sp)) - 5
            max_val = max(max(self.y), max(self.sp)) + 5
        else:
            # Använd normalvärde och börvärde
            nv = self.nv_var.get()
            min_val = min(nv, self.setpoint) - 20
            max_val = max(nv, self.setpoint) + 30
        
        self.process_min.set(min_val)
        self.process_max.set(max_val)
        self.update_plot()
        self.update_percent_status()
        
    def update_percent_status(self):
        """Uppdaterar statustext för procentvisning"""
        if self.percent_mode_var.get() and len(self.y) > 0:
            current_y = self.y[-1]
            current_sp = self.sp[-1] if len(self.sp) > 0 else self.setpoint
            nv = self.nv_var.get()
            
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
                messagebox.showinfo("Export", f"Grafer sparade som:\n{filepath}")
            except Exception as e:
                messagebox.showerror("Fel", f"Kunde inte spara grafer:\n{str(e)}")
    
    def export_data(self):
        """Exportera rådata till CSV-fil"""
        from tkinter import filedialog, messagebox
        import csv
        
        if len(self.t) < 2:
            messagebox.showwarning("Varning", "Ingen data att exportera. Kör simuleringen först.")
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
                        
                messagebox.showinfo("Export", f"Data sparad som:\n{filepath}")
            except Exception as e:
                messagebox.showerror("Fel", f"Kunde inte spara data:\n{str(e)}")
                
    def to_percent(self, value):
        """Konvertera värde till procent baserat på min/max-skalning"""
        min_val = self.process_min.get()
        max_val = self.process_max.get()
        if max_val == min_val:
            return 0.0
        return 100.0 * (value - min_val) / (max_val - min_val)
        
    def from_percent(self, percent):
        """Konvertera från procent till verkligt värde"""
        min_val = self.process_min.get()
        max_val = self.process_max.get()
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
        self.simulate(step=True)

    def reset(self):
        self.running = False
        self._auto_paused = False
        self.current_step = 0
        self.process = Process(
            K=self.parse_float(self.proc_k_var),
            T=self.parse_float(self.proc_t_var),
            dead_time=self.parse_float(self.proc_dead_var),
            integrerande=self.integrerande_var.get(),
            Fout=self.parse_float(self.proc_fout_var),
            normalvarde=self.nv_var.get(),
            matområde_min=self.matområde_min_var.get(),
            matområde_max=self.matområde_max_var.get(),
            enhetslös_K=self.enhetslös_K_var.get()
        )
        self.pid = PID(Kp=self.parse_float(self.kp_var), Ti=self.parse_float(self.ti_var), Td=self.parse_float(self.td_var), dt=self.dt)
        try:
            self.setpoint = float(str(self.sp_var.get()).replace(",", "."))
        except Exception:
            self.setpoint = 0.0
        self.t = [0]
        self.y = [self.nv_var.get()]  # Starta på normalvärdet
        self.u = [0]
        self.e = [0]
        self.i = [0]
        self.d = [0]
        self.sp = [self.setpoint]
        self.update_plot()
        self.formel_label.config(text="")
        self.update_buttons()
    def update_buttons(self):
        # Kör-knappen inaktiv under körning, aktiv annars
        # Om auto-pausad: Kör aktiv, Paus inaktiv
        if self.running:
            self.start_btn.state(["disabled"])
            self.pause_btn.state(["!disabled"])
            self.step_btn.state(["disabled"])
            self.reset_btn.state(["disabled"])
        elif self._auto_paused:
            self.start_btn.state(["!disabled"])
            self.pause_btn.state(["disabled"])
            self.step_btn.state(["!disabled"])
            self.reset_btn.state(["!disabled"])
        else:
            self.start_btn.state(["!disabled"])
            self.pause_btn.state(["disabled"])
            self.step_btn.state(["!disabled"])
            self.reset_btn.state(["!disabled"])

    def simulate(self, step=False):
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
        # Hämta parametrar och hantera decimalkomma
        self.pid.Kp = self.parse_float(self.kp_var)
        Ti = self.parse_float(self.ti_var) if self.i_active_var.get() else 0.0
        Td = self.parse_float(self.td_var) if self.d_active_var.get() else 0.0
        self.pid.Ti = Ti if Ti != 0 else 1e12  # undvik div 0, men ingen I-del om inaktiv
        self.pid.Td = Td
        self.process.K = self.parse_float(self.proc_k_var)
        self.process.T = self.parse_float(self.proc_t_var)
        self.process.dead_time = self.parse_float(self.proc_dead_var)
        self.process.integrerande = self.integrerande_var.get()
        self.process.Fout = self.parse_float(self.proc_fout_var)
        self.process.normalvarde = self.nv_var.get()  # Uppdatera normalvärdet varje steg
        # Uppdatera mätområde och enhetslös K-inställningar
        self.process.matområde_min = self.matområde_min_var.get()
        self.process.matområde_max = self.matområde_max_var.get()
        self.process.enhetslös_K = self.enhetslös_K_var.get()
        # --- Störningar ---
        noise_std = self.noise_std_var.get()
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
            err = self.setpoint - pv
            integ = 0.0
            deriv = 0.0
        else:
            # Automatiskt läge - PID-beräkning med skydd mot division med noll
            try:
                ctrl, err, integ, deriv = self.pid.step(
                    self.setpoint, pv,
                    umin=self.u_min, umax=self.u_max,
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
        self.sp.append(self.setpoint)
        
        # Visa formel och resultat med delmoment
        if self.manual_mode_var.get():
            # Manuellt läge - visa enklare information
            formel = "MANUELLT LÄGE\n"
            res = f"Manuell utsignal = {ctrl:.3f}%\n"
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
        # Välj datafönster
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
            ylabel = 'Processvärde (%)'
            # För procentvisning, använd alltid 0-100% skala eller anpassa efter data
            if len(y_plot) > 0:
                data_min = min(min(y_plot), min(sp_plot) if sp_plot else 0)
                data_max = max(max(y_plot), max(sp_plot) if sp_plot else 100)
                # Lägg till marginal
                margin = (data_max - data_min) * 0.1
                ymin = max(-10, data_min - margin)  # Inte under -10%
                ymax = min(110, data_max + margin)  # Inte över 110%
            else:
                ymin, ymax = 0, 100
        else:
            y_plot = y
            sp_plot = sp
            ylabel = 'Processvärde'
            # Vanlig skalning för verkliga värden
            all_y = y_plot if len(y_plot) > 1 else [0, 1]
            ymin, ymax = min(all_y), max(all_y)
            if ymin == ymax:
                ymin -= 1
                ymax += 1
            
        # Plotta
        self.axs[0].plot(t, sp_plot, 'k--', label='Börvärde')
        self.axs[0].plot(t, y_plot, label='Är-värde')
        # Tunna horisontella linjer för varje yticks (skala)
        yticks = np.linspace(ymin, ymax, num=8)
        for yy in yticks:
            self.axs[0].axhline(yy, color='gray', linewidth=0.3, alpha=0.5, zorder=0)
        self.axs[0].set_ylim(ymin, ymax)
        self.axs[0].set_ylabel(ylabel)
        self.axs[0].legend()

        if self.manual_mode_var.get():
            # Manuellt läge - visa endast styrsignal
            self.axs[1].plot(t, u, label='Manuell styrsignal')
            # Använd endast u-värden för skalning
            all_y = np.array(u)
        else:
            # Automatiskt läge - visa PID-ut och summa
            self.axs[1].plot(t, u, label='PID-ut (begränsad)')
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
            min_len = min([len(comp) for comp in pid_components])
            sum_vals = np.nansum([comp[:min_len] for comp in pid_components], axis=0)
            self.axs[1].plot(t[:min_len], sum_vals, label='Summa (P+I+D)', linestyle='--', color='black', alpha=0.7)
            # Utöka y-axeln så att både u och summagrafen syns
            all_y = np.concatenate([np.array(u)[:min_len], sum_vals])
        # Utöka y-axeln så att både u och summagrafen syns
        umin, umax = np.nanmin(all_y), np.nanmax(all_y)
        if umin == umax:
            umin -= 1
            umax += 1
        uticks = np.linspace(umin, umax, num=8)
        for uu in uticks:
            self.axs[1].axhline(uu, color='gray', linewidth=0.3, alpha=0.5, zorder=0)
        self.axs[1].set_ylim(umin, umax)
        if self.manual_mode_var.get():
            self.axs[1].set_ylabel('Styrsignal (%)')
            self.axs[1].set_xlabel('Tid')  # Visa x-axel i manuellt läge
        else:
            self.axs[1].set_ylabel('Regulatorut')
        self.axs[1].legend()

        # Nedersta: P, I, D-bidrag var för sig (endast i automatläge)
        if self.manual_mode_var.get():
            # Manuellt läge - dölj tredje grafen genom att inte plotta något
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
            self.axs[2].set_ylabel('Bidrag till u')
            self.axs[2].set_xlabel('Tid')
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
        if self.manual_mode_var.get():
            # Manuellt läge - justera layout för endast 2 plottar
            self.fig.subplots_adjust(hspace=0.3)
        else:
            # Automatiskt läge - normal layout för 3 plottar
            self.fig.subplots_adjust(hspace=0.4)
        self.fig.tight_layout()
        self.canvas.draw()
    def reset(self):
        self._just_reset = True
        self.running = False
        self.current_step = 0
        self.process = Process(K=self.parse_float(self.proc_k_var), T=self.parse_float(self.proc_t_var), dead_time=self.parse_float(self.proc_dead_var), integrerande=self.integrerande_var.get(), normalvarde=self.nv_var.get())
        self.pid = PID(Kp=self.parse_float(self.kp_var), Ti=self.parse_float(self.ti_var), Td=self.parse_float(self.td_var), dt=self.dt)
        try:
            self.setpoint = float(str(self.sp_var.get()).replace(",", "."))
        except Exception:
            self.setpoint = 0.0
        self.t = [0]
        self.y = [self.nv_var.get()]  # Starta på normalvärdet
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

import sys

def on_closing(root):
    root.destroy()
    sys.exit(0)

if __name__ == "__main__":
    root = tk.Tk()
    app = PIDSimulatorApp(root)
    root.protocol("WM_DELETE_WINDOW", lambda: on_closing(root))
    root.mainloop()

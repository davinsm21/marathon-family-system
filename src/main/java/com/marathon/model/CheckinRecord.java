package com.marathon.model;

public class CheckinRecord {
    private String pessoa;
    private String data;
    private String horario;
    private String exercicio;
    private String relatos;
    private String alimentacao;
    private Double agua;

    // Getters e setters
    public String getPessoa() { return pessoa; }
    public void setPessoa(String pessoa) { this.pessoa = pessoa; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }

    public String getExercicio() { return exercicio; }
    public void setExercicio(String exercicio) { this.exercicio = exercicio; }

    public String getRelatos() { return relatos; }
    public void setRelatos(String relatos) { this.relatos = relatos; }

    public String getAlimentacao() { return alimentacao; }
    public void setAlimentacao(String alimentacao) { this.alimentacao = alimentacao; }

    public Double getAgua() { return agua; }
    public void setAgua(Double agua) { this.agua = agua; }
}